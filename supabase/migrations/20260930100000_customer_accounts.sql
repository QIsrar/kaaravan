-- Phase 5 Part 1: Customer Accounts

-- 1. wishlists
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  UNIQUE(profile_id, variant_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all wishlists" ON public.wishlists FOR ALL TO authenticated USING ((SELECT private.is_superadmin()));
CREATE POLICY "Customers manage own wishlists" ON public.wishlists FOR ALL TO authenticated USING (profile_id = (select auth.uid()));

-- 2. account_deletion_requests
CREATE TABLE public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trigger_account_deletion_requests_updated_at BEFORE UPDATE ON public.account_deletion_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Admin all account_deletion_requests" ON public.account_deletion_requests FOR ALL TO authenticated USING ((SELECT private.is_superadmin()));
CREATE POLICY "Customers insert own deletion requests" ON public.account_deletion_requests FOR INSERT TO authenticated WITH CHECK (profile_id = (select auth.uid()) AND status = 'pending');
CREATE POLICY "Customers read own deletion requests" ON public.account_deletion_requests FOR SELECT TO authenticated USING (profile_id = (select auth.uid()));

-- 3. Rating recalculation trigger
CREATE OR REPLACE FUNCTION private.recalculate_ratings()
RETURNS trigger AS $$
DECLARE
  v_product_id UUID;
  v_seller_id UUID;
  v_product_avg NUMERIC(3,2);
  v_product_count INT;
  v_seller_avg NUMERIC(3,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  SELECT 
    COALESCE(ROUND(AVG(rating), 2), 0.00),
    COUNT(*)
  INTO v_product_avg, v_product_count
  FROM public.reviews
  WHERE product_id = v_product_id AND status = 'published';

  UPDATE public.products
  SET rating_avg = v_product_avg, rating_count = v_product_count
  WHERE id = v_product_id
  RETURNING seller_id INTO v_seller_id;

  IF v_seller_id IS NOT NULL THEN
    SELECT COALESCE(ROUND(AVG(r.rating), 2), 0.00)
    INTO v_seller_avg
    FROM public.reviews r
    JOIN public.products p ON r.product_id = p.id
    WHERE p.seller_id = v_seller_id AND r.status = 'published';

    UPDATE public.sellers
    SET rating_avg = v_seller_avg
    WHERE id = v_seller_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER trigger_recalculate_ratings
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION private.recalculate_ratings();
