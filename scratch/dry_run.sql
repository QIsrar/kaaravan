BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- Add is_public to settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

-- PART A: Fix Security Advisor warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = pg_catalog.now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE OR REPLACE FUNCTION public.append_only_trigger()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Updates and deletes are not allowed on this table.';
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE OR REPLACE FUNCTION public.products_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql SET search_path = '';

-- Create private schema and move security definer functions
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'superadmin') INTO is_admin
  FROM public.profiles
  WHERE id = (select auth.uid());
  
  RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION private.current_seller_id()
RETURNS UUID AS $$
DECLARE
  s_id UUID;
BEGIN
  SELECT id INTO s_id
  FROM public.sellers
  WHERE owner_profile_id = (select auth.uid())
  LIMIT 1;
  
  RETURN s_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION private.has_permission(perm_name text)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  IF (SELECT private.is_superadmin()) THEN RETURN TRUE; END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM public.admin_permissions 
    WHERE profile_id = (select auth.uid()) AND permission = perm_name
  ) INTO has_perm;
  
  RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION private.qafila_participant_count(deal_id UUID)
RETURNS INT AS $$
DECLARE
  p_count INT;
BEGIN
  SELECT count(*) INTO p_count
  FROM public.qafila_participants
  WHERE qafila_participants.deal_id = $1;
  
  RETURN COALESCE(p_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

DROP FUNCTION IF EXISTS public.is_superadmin();
DROP FUNCTION IF EXISTS public.current_seller_id();

GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_superadmin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.current_seller_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_permission(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.qafila_participant_count(UUID) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.record_price_history() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.append_only_trigger() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.products_search_vector_trigger() FROM public, anon, authenticated;

-- PART B: Auth and roles

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.phone,
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- Trigger: profiles
CREATE OR REPLACE FUNCTION private.prevent_role_escalation() RETURNS trigger AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT (SELECT private.is_superadmin()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role = 'customer';
      NEW.status = 'active';
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.role = OLD.role;
      NEW.status = OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';
CREATE TRIGGER prevent_role_escalation_trigger BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.prevent_role_escalation();

-- Trigger: sellers
CREATE OR REPLACE FUNCTION private.prevent_seller_escalation() RETURNS trigger AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT (SELECT private.is_superadmin()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status = 'pending';
      NEW.commission_rate_bps = NULL;
      NEW.rating_avg = 0;
      NEW.deleted_at = NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.status = OLD.status;
      NEW.commission_rate_bps = OLD.commission_rate_bps;
      NEW.rating_avg = OLD.rating_avg;
      NEW.owner_profile_id = OLD.owner_profile_id;
      NEW.deleted_at = OLD.deleted_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';
CREATE TRIGGER prevent_seller_escalation_trigger BEFORE INSERT OR UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION private.prevent_seller_escalation();

-- Trigger: products
CREATE OR REPLACE FUNCTION private.prevent_product_escalation() RETURNS trigger AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT (SELECT private.is_superadmin()) THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.status NOT IN ('draft', 'pending_review', 'archived') THEN
        NEW.status = 'draft';
      END IF;
      NEW.rejection_reason = NULL;
      NEW.rating_avg = 0;
      NEW.rating_count = 0;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.status NOT IN ('draft', 'pending_review', 'archived') THEN
         NEW.status = OLD.status;
      END IF;
      NEW.rejection_reason = OLD.rejection_reason;
      NEW.rating_avg = OLD.rating_avg;
      NEW.rating_count = OLD.rating_count;
      NEW.seller_id = OLD.seller_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';
CREATE TRIGGER prevent_product_escalation_trigger BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION private.prevent_product_escalation();

-- Trigger: product_variants
CREATE OR REPLACE FUNCTION private.prevent_variant_escalation() RETURNS trigger AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT (SELECT private.is_superadmin()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.reserved_quantity = 0;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.reserved_quantity = OLD.reserved_quantity;
      NEW.product_id = OLD.product_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';
CREATE TRIGGER prevent_variant_escalation_trigger BEFORE INSERT OR UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION private.prevent_variant_escalation();

-- Trigger: seller_documents
CREATE OR REPLACE FUNCTION private.prevent_seller_doc_escalation() RETURNS trigger AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT (SELECT private.is_superadmin()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status = 'pending';
      NEW.reviewed_by = NULL;
      NEW.reviewed_at = NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.status = OLD.status;
      NEW.reviewed_by = OLD.reviewed_by;
      NEW.reviewed_at = OLD.reviewed_at;
      NEW.seller_id = OLD.seller_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';
CREATE TRIGGER prevent_seller_doc_escalation_trigger BEFORE INSERT OR UPDATE ON public.seller_documents FOR EACH ROW EXECUTE FUNCTION private.prevent_seller_doc_escalation();

-- Trigger: seller_bank_accounts
CREATE OR REPLACE FUNCTION private.prevent_seller_bank_escalation() RETURNS trigger AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT (SELECT private.is_superadmin()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_verified = FALSE;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.iban IS DISTINCT FROM OLD.iban THEN
        NEW.is_verified = FALSE;
      ELSE
        NEW.is_verified = OLD.is_verified;
      END IF;
      NEW.seller_id = OLD.seller_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';
CREATE TRIGGER prevent_seller_bank_escalation_trigger BEFORE INSERT OR UPDATE ON public.seller_bank_accounts FOR EACH ROW EXECUTE FUNCTION private.prevent_seller_bank_escalation();

-- Trigger: bank_transfer_proofs
CREATE OR REPLACE FUNCTION private.prevent_proof_escalation() RETURNS trigger AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT (SELECT private.is_superadmin()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status = 'pending';
      NEW.verified_by = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';
CREATE TRIGGER prevent_proof_escalation_trigger BEFORE INSERT ON public.bank_transfer_proofs FOR EACH ROW EXECUTE FUNCTION private.prevent_proof_escalation();

-- Trigger: reviews
CREATE OR REPLACE FUNCTION private.prevent_review_escalation() RETURNS trigger AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT (SELECT private.is_superadmin()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status = 'pending';
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.status = OLD.status;
      NEW.product_id = OLD.product_id;
      NEW.order_item_id = OLD.order_item_id;
      NEW.profile_id = OLD.profile_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';
CREATE TRIGGER prevent_review_escalation_trigger BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION private.prevent_review_escalation();

-- Unique Index on sellers
CREATE UNIQUE INDEX IF NOT EXISTS idx_sellers_owner_profile_id_unique ON public.sellers(owner_profile_id);


-- PART C: RLS Policies

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;


-- 1. profiles
CREATE POLICY "Admin all profiles" ON public.profiles FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_users')));
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING ((select auth.uid()) = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- 2. admin_permissions
CREATE POLICY "Superadmin all admin_permissions" ON public.admin_permissions FOR ALL TO authenticated USING ((SELECT private.is_superadmin()));
CREATE POLICY "Admin staff read own permissions" ON public.admin_permissions FOR SELECT TO authenticated USING (profile_id = (select auth.uid()));

-- 3. addresses
CREATE POLICY "Admin all addresses" ON public.addresses FOR ALL TO authenticated USING ((SELECT private.is_superadmin()));
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL TO authenticated USING (profile_id = (select auth.uid()));

-- 4. sellers
CREATE POLICY "Admin all sellers" ON public.sellers FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_sellers')));
CREATE POLICY "Public read approved sellers" ON public.sellers FOR SELECT TO anon, authenticated USING (status = 'approved' AND deleted_at IS NULL);
CREATE POLICY "Sellers read own seller row" ON public.sellers FOR SELECT TO authenticated USING (owner_profile_id = (select auth.uid()));
CREATE POLICY "Sellers insert own seller row" ON public.sellers FOR INSERT TO authenticated WITH CHECK (owner_profile_id = (select auth.uid()));
CREATE POLICY "Sellers update own seller row" ON public.sellers FOR UPDATE TO authenticated USING (owner_profile_id = (select auth.uid())) WITH CHECK (owner_profile_id = (select auth.uid()));

-- 5. seller_kyc
CREATE POLICY "Admin all seller_kyc" ON public.seller_kyc FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_sellers')));
CREATE POLICY "Sellers manage own kyc" ON public.seller_kyc FOR ALL TO authenticated USING (seller_id = (select private.current_seller_id()));

-- 6. seller_documents
CREATE POLICY "Admin all seller_documents" ON public.seller_documents FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_sellers')));
CREATE POLICY "Sellers manage own documents" ON public.seller_documents FOR ALL TO authenticated USING (seller_id = (select private.current_seller_id()));

-- 7. seller_bank_accounts
CREATE POLICY "Admin all seller_bank_accounts" ON public.seller_bank_accounts FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_sellers')));
CREATE POLICY "Sellers manage own bank_accounts" ON public.seller_bank_accounts FOR ALL TO authenticated USING (seller_id = (select private.current_seller_id()));

-- 8. seller_pickup_addresses
CREATE POLICY "Admin all seller_pickup_addresses" ON public.seller_pickup_addresses FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_sellers')));
CREATE POLICY "Sellers manage own pickup addresses" ON public.seller_pickup_addresses FOR ALL TO authenticated USING (seller_id = (select private.current_seller_id()));

-- 9. categories
CREATE POLICY "Admin all categories" ON public.categories FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_catalog')));
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT TO anon, authenticated USING (is_active = TRUE AND deleted_at IS NULL);

-- 10. brands
CREATE POLICY "Admin all brands" ON public.brands FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_catalog')));
CREATE POLICY "Public read active brands" ON public.brands FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);

-- 11. products
CREATE POLICY "Admin all products" ON public.products FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_catalog')));
CREATE POLICY "Public read active products" ON public.products FOR SELECT TO anon, authenticated USING (
  status = 'active' AND deleted_at IS NULL AND
  EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = seller_id AND s.status = 'approved' AND s.deleted_at IS NULL)
);
CREATE POLICY "Sellers manage own products" ON public.products FOR ALL TO authenticated USING (
  seller_id = (select private.current_seller_id()) AND
  EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = seller_id AND s.status = 'approved' AND s.deleted_at IS NULL)
);

-- 12. product_variants
CREATE POLICY "Admin all variants" ON public.product_variants FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_catalog')));
CREATE POLICY "Public read active variants" ON public.product_variants FOR SELECT TO anon, authenticated USING (
  is_active = TRUE AND deleted_at IS NULL AND
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.sellers s ON p.seller_id = s.id
    WHERE p.id = product_id AND p.status = 'active' AND p.deleted_at IS NULL
    AND s.status = 'approved' AND s.deleted_at IS NULL
  )
);
CREATE POLICY "Sellers manage own variants" ON public.product_variants FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.sellers s ON p.seller_id = s.id
    WHERE p.id = product_id AND p.seller_id = (select private.current_seller_id())
    AND s.status = 'approved' AND s.deleted_at IS NULL
  )
);

-- 13. product_images
CREATE POLICY "Admin all product_images" ON public.product_images FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_catalog')));
CREATE POLICY "Public read active product_images" ON public.product_images FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.sellers s ON p.seller_id = s.id
    WHERE p.id = product_id AND p.status = 'active' AND p.deleted_at IS NULL
    AND s.status = 'approved' AND s.deleted_at IS NULL
  )
);
CREATE POLICY "Sellers manage own product_images" ON public.product_images FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.sellers s ON p.seller_id = s.id
    WHERE p.id = product_id AND p.seller_id = (select private.current_seller_id())
    AND s.status = 'approved' AND s.deleted_at IS NULL
  )
);

-- 14. price_history
CREATE POLICY "Admin all price_history" ON public.price_history FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_catalog')));
CREATE POLICY "Public read price_history" ON public.price_history FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM public.product_variants v
    JOIN public.products p ON v.product_id = p.id
    JOIN public.sellers s ON p.seller_id = s.id
    WHERE v.id = variant_id AND p.status = 'active' AND p.deleted_at IS NULL
    AND s.status = 'approved' AND s.deleted_at IS NULL
  )
);

-- 15. carts
CREATE POLICY "Admin all carts" ON public.carts FOR ALL TO authenticated USING ((SELECT private.is_superadmin()));
CREATE POLICY "Customers manage own carts" ON public.carts FOR ALL TO authenticated USING (profile_id = (select auth.uid()));

-- 16. cart_items
CREATE POLICY "Admin all cart_items" ON public.cart_items FOR ALL TO authenticated USING ((SELECT private.is_superadmin()));
CREATE POLICY "Customers manage own cart_items" ON public.cart_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.profile_id = (select auth.uid()))
);

-- 17. orders
CREATE POLICY "Admin all orders" ON public.orders FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_orders')));
CREATE POLICY "Customers read own orders" ON public.orders FOR SELECT TO authenticated USING (profile_id = (select auth.uid()));

-- 18. sub_orders
CREATE POLICY "Admin all sub_orders" ON public.sub_orders FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_orders')));
CREATE POLICY "Customers read own sub_orders" ON public.sub_orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.profile_id = (select auth.uid()))
);
CREATE POLICY "Sellers read own sub_orders" ON public.sub_orders FOR SELECT TO authenticated USING (seller_id = (select private.current_seller_id()));

-- 19. order_items
CREATE POLICY "Admin all order_items" ON public.order_items FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_orders')));
CREATE POLICY "Customers read own order_items" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.sub_orders so
    JOIN public.orders o ON so.order_id = o.id
    WHERE so.id = sub_order_id AND o.profile_id = (select auth.uid())
  )
);
CREATE POLICY "Sellers read own order_items" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sub_orders so WHERE so.id = sub_order_id AND so.seller_id = (select private.current_seller_id()))
);

-- 20. order_status_history
CREATE POLICY "Admin all order_status_history" ON public.order_status_history FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_orders')));
CREATE POLICY "Customers read own order_status_history" ON public.order_status_history FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.sub_orders so
    JOIN public.orders o ON so.order_id = o.id
    WHERE so.id = sub_order_id AND o.profile_id = (select auth.uid())
  )
);
CREATE POLICY "Sellers read own order_status_history" ON public.order_status_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sub_orders so WHERE so.id = sub_order_id AND so.seller_id = (select private.current_seller_id()))
);

-- 21. payments
CREATE POLICY "Admin all payments" ON public.payments FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_finance')));
CREATE POLICY "Customers read own payments" ON public.payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.profile_id = (select auth.uid()))
);

-- 22. commissions
CREATE POLICY "Admin all commissions" ON public.commissions FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_finance')));
CREATE POLICY "Sellers read own commissions" ON public.commissions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sub_orders so WHERE so.id = sub_order_id AND so.seller_id = (select private.current_seller_id()))
);

-- 23. seller_ledger
CREATE POLICY "Admin all seller_ledger" ON public.seller_ledger FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_finance')));
CREATE POLICY "Sellers read own ledger" ON public.seller_ledger FOR SELECT TO authenticated USING (seller_id = (select private.current_seller_id()));

-- 24. payouts
CREATE POLICY "Admin all payouts" ON public.payouts FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_finance')));
CREATE POLICY "Sellers read own payouts" ON public.payouts FOR SELECT TO authenticated USING (seller_id = (select private.current_seller_id()));

-- 25. cod_remittances
CREATE POLICY "Admin all cod_remittances" ON public.cod_remittances FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_finance')));

-- 26. cod_remittance_items
CREATE POLICY "Admin all cod_remittance_items" ON public.cod_remittance_items FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_finance')));

-- 27. couriers
CREATE POLICY "Admin all couriers" ON public.couriers FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_logistics')));

-- 28. shipments
CREATE POLICY "Admin all shipments" ON public.shipments FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_logistics')));
CREATE POLICY "Sellers read own shipments" ON public.shipments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sub_orders so WHERE so.id = sub_order_id AND so.seller_id = (select private.current_seller_id()))
);
CREATE POLICY "Customers read own shipments" ON public.shipments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.sub_orders so
    JOIN public.orders o ON so.order_id = o.id
    WHERE so.id = sub_order_id AND o.profile_id = (select auth.uid())
  )
);

-- 29. shipment_events
CREATE POLICY "Admin all shipment_events" ON public.shipment_events FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_logistics')));
CREATE POLICY "Customers read own shipment_events" ON public.shipment_events FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.shipments s
    JOIN public.sub_orders so ON s.sub_order_id = so.id
    JOIN public.orders o ON so.order_id = o.id
    WHERE s.id = shipment_id AND o.profile_id = (select auth.uid())
  )
);
CREATE POLICY "Sellers read own shipment_events" ON public.shipment_events FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.shipments s
    JOIN public.sub_orders so ON s.sub_order_id = so.id
    WHERE s.id = shipment_id AND so.seller_id = (select private.current_seller_id())
  )
);

-- 30. bank_transfer_proofs
CREATE POLICY "Admin all bank_transfer_proofs" ON public.bank_transfer_proofs FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_finance')));
CREATE POLICY "Customers read own bank_transfer_proofs" ON public.bank_transfer_proofs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.profile_id = (select auth.uid()))
);
CREATE POLICY "Customers insert own bank_transfer_proofs" ON public.bank_transfer_proofs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.profile_id = (select auth.uid()))
);

-- 31. returns
CREATE POLICY "Admin all returns" ON public.returns FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_orders')));
CREATE POLICY "Customers read own returns" ON public.returns FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.sub_orders so
    JOIN public.orders o ON so.order_id = o.id
    WHERE so.id = sub_order_id AND o.profile_id = (select auth.uid())
  )
);
CREATE POLICY "Sellers read own returns" ON public.returns FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sub_orders so WHERE so.id = sub_order_id AND so.seller_id = (select private.current_seller_id()))
);

-- 32. reviews
CREATE POLICY "Admin all reviews" ON public.reviews FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_catalog')));
CREATE POLICY "Public read published reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Customers insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  profile_id = (select auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.sub_orders so ON oi.sub_order_id = so.id
    JOIN public.orders o ON so.order_id = o.id
    JOIN public.product_variants pv ON oi.variant_id = pv.id
    WHERE oi.id = order_item_id AND so.status = 'delivered' AND o.profile_id = (select auth.uid()) AND pv.product_id = reviews.product_id
  )
);
CREATE POLICY "Customers update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (
  profile_id = (select auth.uid())
) WITH CHECK (
  profile_id = (select auth.uid())
);
CREATE POLICY "Customers read own reviews" ON public.reviews FOR SELECT TO authenticated USING (profile_id = (select auth.uid()));

-- 33. disputes
CREATE POLICY "Admin all disputes" ON public.disputes FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_disputes')));
CREATE POLICY "Customers insert own disputes" ON public.disputes FOR INSERT TO authenticated WITH CHECK (
  opened_by = (select auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.sub_orders so
    JOIN public.orders o ON so.order_id = o.id
    WHERE so.id = sub_order_id AND o.profile_id = (select auth.uid())
  )
);
CREATE POLICY "Customers read own disputes" ON public.disputes FOR SELECT TO authenticated USING (opened_by = (select auth.uid()));
CREATE POLICY "Sellers read own disputes" ON public.disputes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sub_orders so WHERE so.id = sub_order_id AND so.seller_id = (select private.current_seller_id()))
);

-- 34. dispute_messages
CREATE POLICY "Admin all dispute_messages" ON public.dispute_messages FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_disputes')));
CREATE POLICY "Participants read dispute_messages" ON public.dispute_messages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.disputes d
    LEFT JOIN public.sub_orders so ON d.sub_order_id = so.id
    WHERE d.id = dispute_id AND (d.opened_by = (select auth.uid()) OR so.seller_id = (select private.current_seller_id()))
  )
);
CREATE POLICY "Participants insert dispute_messages" ON public.dispute_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = (select auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.disputes d
    LEFT JOIN public.sub_orders so ON d.sub_order_id = so.id
    WHERE d.id = dispute_id AND (d.opened_by = (select auth.uid()) OR so.seller_id = (select private.current_seller_id()))
  )
);

-- 35. coupons
CREATE POLICY "Admin all coupons" ON public.coupons FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_promotions')));

-- 36. coupon_redemptions
CREATE POLICY "Admin all coupon_redemptions" ON public.coupon_redemptions FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_promotions')));
CREATE POLICY "Customers read own coupon_redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING (profile_id = (select auth.uid()));

-- 37. banners
CREATE POLICY "Admin all banners" ON public.banners FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_content')));
CREATE POLICY "Public read active banners" ON public.banners FOR SELECT TO anon, authenticated USING (is_active = TRUE);

-- 38. notifications
CREATE POLICY "Admin all notifications" ON public.notifications FOR ALL TO authenticated USING ((SELECT private.is_superadmin()));
CREATE POLICY "Customers read own notifications" ON public.notifications FOR SELECT TO authenticated USING (profile_id = (select auth.uid()));
CREATE POLICY "Customers update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (profile_id = (select auth.uid())) WITH CHECK (profile_id = (select auth.uid()));

-- 39. settings
CREATE POLICY "Admin all settings" ON public.settings FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_settings')));
CREATE POLICY "Public read settings" ON public.settings FOR SELECT TO anon, authenticated USING (is_public = TRUE);

-- 40. search_synonyms
CREATE POLICY "Admin all search_synonyms" ON public.search_synonyms FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_catalog')));
CREATE POLICY "Public read search_synonyms" ON public.search_synonyms FOR SELECT TO anon, authenticated USING (TRUE);

-- 41. offers
CREATE POLICY "Admin all offers" ON public.offers FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_orders')));
CREATE POLICY "Customers read own offers" ON public.offers FOR SELECT TO authenticated USING (buyer_id = (select auth.uid()));
CREATE POLICY "Sellers read own offers" ON public.offers FOR SELECT TO authenticated USING (seller_id = (select private.current_seller_id()));

-- 42. qafila_deals
CREATE POLICY "Admin all qafila_deals" ON public.qafila_deals FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_promotions')));
CREATE POLICY "Public read active qafila_deals" ON public.qafila_deals FOR SELECT TO anon, authenticated USING (status = 'active');

-- 43. qafila_participants
CREATE POLICY "Admin all qafila_participants" ON public.qafila_participants FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_promotions')));
CREATE POLICY "Customers read own qafila_participants" ON public.qafila_participants FOR SELECT TO authenticated USING (buyer_id = (select auth.uid()));

-- 44. buyer_trust
CREATE POLICY "Admin all buyer_trust" ON public.buyer_trust FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_users')));

-- 45. cod_confirmations
CREATE POLICY "Admin all cod_confirmations" ON public.cod_confirmations FOR ALL TO authenticated USING ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_orders')));
CREATE POLICY "Customers read own cod_confirmations" ON public.cod_confirmations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.profile_id = (select auth.uid()))
);

-- 46. audit_logs
CREATE POLICY "Admin all audit_logs" ON public.audit_logs FOR ALL TO authenticated USING ((SELECT private.is_superadmin()));

-- PART D: Storage Policies

CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Public read seller-branding" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'seller-branding');
CREATE POLICY "Public read banners" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'banners');

CREATE POLICY "Admin manage product-images" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'product-images' AND ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_catalog'))));
CREATE POLICY "Admin manage seller-branding" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'seller-branding' AND ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_catalog'))));
CREATE POLICY "Admin manage banners" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'banners' AND ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_content'))));

CREATE POLICY "Sellers manage product-images" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'product-images' AND (storage.foldername(name))[1] = (select private.current_seller_id())::text
);
CREATE POLICY "Sellers manage seller-branding" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'seller-branding' AND (storage.foldername(name))[1] = (select private.current_seller_id())::text
);

CREATE POLICY "Admin manage seller-documents" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'seller-documents' AND ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_sellers'))));
CREATE POLICY "Sellers manage seller-documents" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'seller-documents' AND (storage.foldername(name))[1] = (select private.current_seller_id())::text
);

CREATE POLICY "Admin manage payment-proofs" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'payment-proofs' AND ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_finance'))));
CREATE POLICY "Customers manage payment-proofs" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'payment-proofs' AND (select auth.uid())::text = (storage.foldername(name))[1] 
);

CREATE POLICY "Admin manage return-evidence" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'return-evidence' AND ((SELECT private.is_superadmin()) OR (SELECT private.has_permission('manage_orders'))));
CREATE POLICY "Customers manage return-evidence" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'return-evidence' AND (select auth.uid())::text = (storage.foldername(name))[1]
);
CREATE POLICY "Sellers read return-evidence" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'return-evidence' AND (select private.current_seller_id())::text = (storage.foldername(name))[2]
);


-- TESTS

CREATE TEMP TABLE test_results (result text);
GRANT ALL ON TABLE test_results TO anon, authenticated, postgres;
INSERT INTO test_results SELECT plan(13);

CREATE OR REPLACE FUNCTION tests_set_auth(user_id uuid, role text DEFAULT 'authenticated') RETURNS void AS $$
BEGIN
  EXECUTE format('set local role %I', role);
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "role": "%s"}', user_id, role), true);
END;
$$ LANGUAGE plpgsql;

RESET ROLE;
SET local role postgres;

INSERT INTO auth.users (id, email) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'seller_a@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'seller_b@test.com'),
  ('33333333-3333-3333-3333-333333333333', 'customer_a@test.com'),
  ('44444444-4444-4444-4444-444444444444', 'customer_b@test.com');
  
UPDATE public.profiles SET role = 'seller' WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

INSERT INTO public.sellers (id, owner_profile_id, business_name, slug, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Seller A', 'seller-a', 'approved'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Seller B', 'seller-b', 'approved');

INSERT INTO public.categories (id, name, slug) VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Test Category', 'test-category');

INSERT INTO public.products (id, seller_id, category_id, title, slug, status) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Draft Product', 'draft-prod', 'draft'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Active Product', 'active-prod', 'active'),
  ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Other Product', 'other-prod', 'active');

INSERT INTO public.orders (id, order_number, profile_id, shipping_address, billing_address, payment_method, subtotal_minor, shipping_minor, total_minor) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ORD-1', '33333333-3333-3333-3333-333333333333', '{}', '{}', 'cod', 100, 0, 100),
  ('10000000-0000-0000-0000-000000000000', 'ORD-2', '44444444-4444-4444-4444-444444444444', '{}', '{}', 'cod', 100, 0, 100);

INSERT INTO public.sub_orders (id, order_id, seller_id, status, subtotal_minor, shipping_minor, total_minor) VALUES
  ('20000000-0000-0000-0000-000000000000', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'delivered', 100, 0, 100),
  ('30000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'pending', 100, 0, 100);

INSERT INTO public.product_variants (id, product_id, sku, price_minor) VALUES
  ('50000000-0000-0000-0000-000000000000', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'SKU-1', 100);
  
INSERT INTO public.order_items (id, sub_order_id, variant_id, product_title, variant_attributes, unit_price_minor, quantity, line_total_minor) VALUES
  ('40000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000000', 'Title', '{}', 100, 1, 100);

INSERT INTO public.seller_kyc (seller_id, cnic_number) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '12345');


-- 1. Seller A cannot read seller B's sub_orders
RESET ROLE;
SELECT tests_set_auth('11111111-1111-1111-1111-111111111111', 'authenticated');
INSERT INTO test_results SELECT is(
  (SELECT count(*) FROM public.sub_orders),
  1::bigint,
  'Seller A should only see 1 sub_order (their own)'
);

-- 2. Customer cannot read another customer's order
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
INSERT INTO test_results SELECT is(
  (SELECT count(*) FROM public.orders),
  1::bigint,
  'Customer A should only see their own order'
);

-- 3. Anon cannot read draft products
RESET ROLE;
SELECT tests_set_auth('00000000-0000-0000-0000-000000000000', 'anon');
INSERT INTO test_results SELECT is(
  (SELECT count(*) FROM public.products WHERE status = 'draft'),
  0::bigint,
  'Anon cannot read draft products'
);

-- 4. Anon cannot read seller_kyc
RESET ROLE;
SELECT tests_set_auth('00000000-0000-0000-0000-000000000000', 'anon');
INSERT INTO test_results SELECT is(
  (SELECT count(*) FROM public.seller_kyc),
  0::bigint,
  'Anon cannot read seller_kyc'
);

-- 5. Nobody can update seller_ledger from the client
RESET ROLE;
SET local role postgres;
INSERT INTO public.seller_ledger (id, seller_id, entry_type, amount_minor, balance_after_minor, available_at) VALUES 
  ('60000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sale', 100, 100, pg_catalog.now());

RESET ROLE;
SELECT tests_set_auth('11111111-1111-1111-1111-111111111111', 'authenticated');
UPDATE public.seller_ledger SET amount_minor = 999 WHERE id = '60000000-0000-0000-0000-000000000000';
RESET ROLE;
SET local role postgres;
INSERT INTO test_results SELECT is(
  (SELECT amount_minor FROM public.seller_ledger WHERE id = '60000000-0000-0000-0000-000000000000'),
  100::bigint,
  'Client cannot update seller_ledger (update should not change the row due to missing UPDATE policy)'
);

-- 6. User cannot change own role
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
UPDATE public.profiles SET role = 'superadmin' WHERE id = '33333333-3333-3333-3333-333333333333';
INSERT INTO test_results SELECT is(
  (SELECT role::text FROM public.profiles WHERE id = '33333333-3333-3333-3333-333333333333'),
  'customer',
  'User cannot change their own role'
);

-- 7. Client cannot insert an approved seller
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
INSERT INTO public.sellers (owner_profile_id, business_name, slug, status) VALUES ('33333333-3333-3333-3333-333333333333', 'Test', 'test', 'approved');
INSERT INTO test_results SELECT is(
  (SELECT status::text FROM public.sellers WHERE slug = 'test'),
  'pending',
  'Client inserted seller must default to pending'
);

-- 8. Seller cannot set a product active (only draft/pending_review/archived)
RESET ROLE;
SELECT tests_set_auth('11111111-1111-1111-1111-111111111111', 'authenticated');
INSERT INTO public.products (seller_id, category_id, title, slug, status) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Test Prod', 'test-slug', 'active');
INSERT INTO test_results SELECT is(
  (SELECT status::text FROM public.products WHERE slug = 'test-slug'),
  'draft',
  'Client inserted product must default to draft if tried to set active'
);

-- 9. Customer cannot set a return to refunded
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
INSERT INTO test_results SELECT throws_ok(
  $$ INSERT INTO public.returns (order_item_id, sub_order_id, reason, refund_minor, status) VALUES ('40000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000000', 'Reason', 100, 'requested') $$,
  '42501',
  NULL,
  'Customer cannot insert returns via client (SELECT-only policy)'
);

-- 10. Buyer cannot accept own offer
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
INSERT INTO test_results SELECT throws_ok(
  $$ INSERT INTO public.offers (variant_id, buyer_id, seller_id, offered_minor, status, expires_at) VALUES ('50000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50, 'accepted', pg_catalog.now()) $$,
  '42501',
  NULL,
  'Customer cannot insert offers via client (SELECT-only policy)'
);

-- 11. User cannot insert a second seller row
RESET ROLE;
SELECT tests_set_auth('11111111-1111-1111-1111-111111111111', 'authenticated');
INSERT INTO test_results SELECT throws_ok(
  $$ INSERT INTO public.sellers (owner_profile_id, business_name, slug, status) VALUES ('11111111-1111-1111-1111-111111111111', 'Seller A 2', 'seller-a-2', 'pending') $$,
  '23505',
  NULL,
  'User cannot insert a second seller row (unique index constraint)'
);

-- 12. Test dispute insert requirements
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
INSERT INTO test_results SELECT throws_ok(
  $$ INSERT INTO public.disputes (sub_order_id, opened_by) VALUES ('30000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333') $$,
  '42501',
  NULL,
  'Customer cannot open dispute for sub_order belonging to another customer'
);

-- 13. Test reviews insert requirements for correct product_id mapping
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
-- Sub_order is delivered, order_item is valid and customer's own.
-- Trying to review product Y ('999...999') using order_item ('400...000') that maps to product X ('eee...eee').
INSERT INTO test_results SELECT throws_ok(
  $$ INSERT INTO public.reviews (profile_id, product_id, order_item_id, title, body, rating) VALUES ('33333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999', '40000000-0000-0000-0000-000000000000', 'Test', 'Body', 5) $$,
  '42501',
  NULL,
  'Customer cannot review a product mismatching the order item''s actual product'
);


INSERT INTO test_results SELECT * FROM finish();
SELECT * FROM test_results;
ROLLBACK;
