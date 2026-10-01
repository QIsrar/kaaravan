-- Phase 6: Seller Portal
-- Add low_stock_threshold to product_variants

ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0);

ALTER TABLE public.sellers
ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMPTZ;

-- Dashboard stats RPC
CREATE OR REPLACE FUNCTION public.get_seller_dashboard_stats(p_seller_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sales_today BIGINT;
  v_sales_7d BIGINT;
  v_sales_30d BIGINT;
  v_pending_orders INT;
  v_low_stock INT;
  v_available_balance BIGINT;
  v_held_balance BIGINT;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Verify ownership/permissions
  IF NOT (
    COALESCE((SELECT private.is_superadmin()), false) OR 
    (SELECT auth.uid()) = (SELECT owner_profile_id FROM public.sellers WHERE id = p_seller_id)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Sales (minor units)
  SELECT COALESCE(SUM(total_minor), 0) INTO v_sales_today FROM public.sub_orders 
  WHERE seller_id = p_seller_id AND status NOT IN ('cancelled', 'returned') AND created_at >= pg_catalog.now() - INTERVAL '1 day';

  SELECT COALESCE(SUM(total_minor), 0) INTO v_sales_7d FROM public.sub_orders 
  WHERE seller_id = p_seller_id AND status NOT IN ('cancelled', 'returned') AND created_at >= pg_catalog.now() - INTERVAL '7 days';

  SELECT COALESCE(SUM(total_minor), 0) INTO v_sales_30d FROM public.sub_orders 
  WHERE seller_id = p_seller_id AND status NOT IN ('cancelled', 'returned') AND created_at >= pg_catalog.now() - INTERVAL '30 days';

  -- Pending Orders
  SELECT COUNT(*) INTO v_pending_orders FROM public.sub_orders 
  WHERE seller_id = p_seller_id AND status IN ('awaiting_confirmation', 'pending', 'confirmed', 'packed', 'ready_to_ship');

  -- Low Stock
  SELECT COUNT(*) INTO v_low_stock FROM public.product_variants v
  JOIN public.products p ON p.id = v.product_id
  WHERE p.seller_id = p_seller_id AND p.deleted_at IS NULL AND v.is_active = true AND (v.stock_quantity - v.reserved_quantity) <= v.low_stock_threshold;

  -- Balances (naive sum of ledger, available vs held based on available_at)
  SELECT COALESCE(SUM(amount_minor) FILTER (WHERE available_at <= pg_catalog.now()), 0),
         COALESCE(SUM(amount_minor) FILTER (WHERE available_at > pg_catalog.now()), 0)
  INTO v_available_balance, v_held_balance
  FROM public.seller_ledger
  WHERE seller_id = p_seller_id;

  RETURN jsonb_build_object(
    'sales_today', v_sales_today,
    'sales_7d', v_sales_7d,
    'sales_30d', v_sales_30d,
    'pending_orders', v_pending_orders,
    'low_stock', v_low_stock,
    'available_balance', v_available_balance,
    'held_balance', v_held_balance
  );
END
$$;

REVOKE EXECUTE ON FUNCTION public.get_seller_dashboard_stats(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_seller_dashboard_stats(UUID) TO authenticated;


CREATE OR REPLACE FUNCTION public.submit_seller_application(
  p_profile_id UUID,
  p_business_name TEXT,
  p_slug TEXT,
  p_description TEXT,
  p_business_type TEXT,
  p_cnic TEXT,
  p_ntn TEXT,
  p_bank_name TEXT,
  p_account_title TEXT,
  p_iban TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_province TEXT,
  p_city TEXT,
  p_area TEXT,
  p_street TEXT,
  p_postal_code TEXT,
  p_ip_address TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_seller_id UUID;
  v_existing_status TEXT;
  v_masked_cnic TEXT;
BEGIN
  -- We assume service_role calls this, so it has bypass RLS essentially, but we ensure it's not called by others
  
  -- Check if rejected seller exists to reapply
  SELECT id, status INTO v_seller_id, v_existing_status FROM public.sellers WHERE owner_profile_id = p_profile_id;
  
  IF v_seller_id IS NOT NULL THEN
    IF v_existing_status = 'rejected' THEN
      UPDATE public.sellers SET 
        business_name = p_business_name,
        slug = p_slug,
        description = p_description,
        business_type = p_business_type,
        status = 'pending',
        agreement_accepted_at = pg_catalog.now()
      WHERE id = v_seller_id;
      
      UPDATE public.seller_kyc SET cnic_number = p_cnic, ntn = p_ntn WHERE seller_id = v_seller_id;
      UPDATE public.seller_bank_accounts SET bank_name = p_bank_name, account_title = p_account_title, iban = p_iban WHERE seller_id = v_seller_id;
      UPDATE public.seller_pickup_addresses SET 
        full_name = p_full_name, phone = p_phone, province = p_province, city = p_city,
        area = p_area, street = p_street, postal_code = p_postal_code
      WHERE seller_id = v_seller_id AND is_default = true;
    ELSE
      RAISE EXCEPTION 'Application already exists with status %', v_existing_status;
    END IF;
  ELSE
    INSERT INTO public.sellers (owner_profile_id, business_name, slug, description, business_type, status, agreement_accepted_at)
    VALUES (p_profile_id, p_business_name, p_slug, p_description, p_business_type, 'pending', pg_catalog.now())
    RETURNING id INTO v_seller_id;
    
    INSERT INTO public.seller_kyc (seller_id, cnic_number, ntn) VALUES (v_seller_id, p_cnic, p_ntn);
    INSERT INTO public.seller_bank_accounts (seller_id, bank_name, account_title, iban) VALUES (v_seller_id, p_bank_name, p_account_title, p_iban);
    INSERT INTO public.seller_pickup_addresses (seller_id, full_name, phone, province, city, area, street, postal_code, is_default)
    VALUES (v_seller_id, p_full_name, p_phone, p_province, p_city, p_area, p_street, p_postal_code, true);
  END IF;

  v_masked_cnic := '****-' || right(p_cnic, 4);

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, before, after, ip)
  VALUES (
    p_profile_id, 
    'SELLER_ONBOARDING_SUBMITTED', 
    'sellers', 
    v_seller_id, 
    NULL, 
    jsonb_build_object('business_name', p_business_name, 'cnic_masked', v_masked_cnic), 
    p_ip_address
  );

  RETURN v_seller_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_seller_application FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_seller_application TO service_role;

-- Ensure schema cache is refreshed if needed (optional but good practice)
NOTIFY pgrst, 'reload schema';
