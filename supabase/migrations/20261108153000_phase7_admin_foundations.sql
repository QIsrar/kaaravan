-- Phase 7 PART 1: Admin Foundations
-- Migration: 20261108153000_phase7_admin_foundations.sql

-- 1. Seller Bank Change Requests Table
CREATE TABLE IF NOT EXISTS public.seller_bank_change_requests (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_title TEXT NOT NULL,
  iban TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

ALTER TABLE public.seller_bank_change_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_seller_bank_change_requests_seller_id ON public.seller_bank_change_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_bank_change_requests_status ON public.seller_bank_change_requests(status);

DROP TRIGGER IF EXISTS trigger_seller_bank_change_requests_updated_at ON public.seller_bank_change_requests;
CREATE TRIGGER trigger_seller_bank_change_requests_updated_at
  BEFORE UPDATE ON public.seller_bank_change_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for seller_bank_change_requests
DROP POLICY IF EXISTS "Superadmin all seller_bank_change_requests" ON public.seller_bank_change_requests;
CREATE POLICY "Superadmin all seller_bank_change_requests"
  ON public.seller_bank_change_requests FOR ALL TO authenticated
  USING ((SELECT private.is_superadmin()));

DROP POLICY IF EXISTS "Admin manage_finance seller_bank_change_requests" ON public.seller_bank_change_requests;
CREATE POLICY "Admin manage_finance seller_bank_change_requests"
  ON public.seller_bank_change_requests FOR ALL TO authenticated
  USING ((SELECT private.has_permission('manage_finance')));

DROP POLICY IF EXISTS "Sellers read own bank_change_requests" ON public.seller_bank_change_requests;
CREATE POLICY "Sellers read own bank_change_requests"
  ON public.seller_bank_change_requests FOR SELECT TO authenticated
  USING (seller_id = (SELECT private.current_seller_id()));

DROP POLICY IF EXISTS "Sellers insert own bank_change_requests" ON public.seller_bank_change_requests;
CREATE POLICY "Sellers insert own bank_change_requests"
  ON public.seller_bank_change_requests FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = (SELECT private.current_seller_id())
    AND status = 'pending'
  );

-- 2. Add status_reason to sellers (for rejection / suspension reasons)
ALTER TABLE public.sellers
ADD COLUMN IF NOT EXISTS status_reason TEXT;

-- 3. Add bilingual localization columns to banners
ALTER TABLE public.banners
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_ur TEXT,
ADD COLUMN IF NOT EXISTS subtitle_en TEXT,
ADD COLUMN IF NOT EXISTS subtitle_ur TEXT,
ADD COLUMN IF NOT EXISTS tag_en TEXT,
ADD COLUMN IF NOT EXISTS tag_ur TEXT;

-- 4. Single-transaction function to approve seller application
CREATE OR REPLACE FUNCTION public.approve_seller(
  p_seller_id UUID,
  p_admin_id UUID,
  p_ip_address TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_profile_id UUID;
  v_current_status public.seller_status;
BEGIN
  -- Permission check: superadmin or manage_sellers permission
  IF NOT (
    COALESCE((SELECT private.is_superadmin()), false) OR 
    COALESCE((SELECT private.has_permission('manage_sellers')), false)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT owner_profile_id, status INTO v_owner_profile_id, v_current_status
  FROM public.sellers
  WHERE id = p_seller_id;

  IF v_owner_profile_id IS NULL THEN
    RAISE EXCEPTION 'Seller not found';
  END IF;

  IF v_current_status = 'approved' THEN
    RETURN;
  END IF;

  -- Update sellers status and clear previous status_reason
  UPDATE public.sellers
  SET status = 'approved',
      status_reason = NULL,
      updated_at = pg_catalog.now()
  WHERE id = p_seller_id;

  -- Update profile role to seller in same transaction
  UPDATE public.profiles
  SET role = 'seller',
      updated_at = pg_catalog.now()
  WHERE id = v_owner_profile_id;

  -- Append audit log
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, before, after, ip)
  VALUES (
    p_admin_id,
    'SELLER_APPROVED',
    'sellers',
    p_seller_id,
    jsonb_build_object('status', v_current_status),
    jsonb_build_object('status', 'approved', 'profile_role', 'seller'),
    p_ip_address
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_seller(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_seller(UUID, UUID, TEXT) TO authenticated, service_role;

-- 5. Single-transaction function to approve seller bank change request
CREATE OR REPLACE FUNCTION public.approve_seller_bank_change_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_ip_address TEXT,
  p_note TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_req RECORD;
  v_old_bank RECORD;
  v_masked_old_iban TEXT;
  v_masked_new_iban TEXT;
BEGIN
  -- Permission check: superadmin or manage_finance permission
  IF NOT (
    COALESCE((SELECT private.is_superadmin()), false) OR 
    COALESCE((SELECT private.has_permission('manage_finance')), false)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT * INTO v_req
  FROM public.seller_bank_change_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is already processed';
  END IF;

  -- Look up existing bank row
  SELECT * INTO v_old_bank
  FROM public.seller_bank_accounts
  WHERE seller_id = v_req.seller_id
  LIMIT 1;

  v_masked_old_iban := CASE WHEN v_old_bank.iban IS NOT NULL THEN '****' || right(v_old_bank.iban, 4) ELSE NULL END;
  v_masked_new_iban := '****' || right(v_req.iban, 4);

  -- Replace / upsert bank account row
  IF v_old_bank.id IS NOT NULL THEN
    UPDATE public.seller_bank_accounts
    SET bank_name = v_req.bank_name,
        account_title = v_req.account_title,
        iban = v_req.iban,
        is_verified = TRUE,
        updated_at = pg_catalog.now()
    WHERE id = v_old_bank.id;
  ELSE
    INSERT INTO public.seller_bank_accounts (seller_id, bank_name, account_title, iban, is_verified)
    VALUES (v_req.seller_id, v_req.bank_name, v_req.account_title, v_req.iban, TRUE);
  END IF;

  -- Mark change request approved
  UPDATE public.seller_bank_change_requests
  SET status = 'approved',
      reviewed_by = p_admin_id,
      reason = COALESCE(p_note, reason),
      updated_at = pg_catalog.now()
  WHERE id = p_request_id;

  -- Append audit log with masked IBAN
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, before, after, ip)
  VALUES (
    p_admin_id,
    'SELLER_BANK_DETAILS_UPDATED',
    'seller_bank_accounts',
    COALESCE(v_old_bank.id, v_req.seller_id),
    jsonb_build_object(
      'bank_name', v_old_bank.bank_name,
      'account_title', v_old_bank.account_title,
      'iban_masked', v_masked_old_iban
    ),
    jsonb_build_object(
      'bank_name', v_req.bank_name,
      'account_title', v_req.account_title,
      'iban_masked', v_masked_new_iban,
      'request_id', p_request_id
    ),
    p_ip_address
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_seller_bank_change_request(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_seller_bank_change_request(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;

-- Grant permissions to service_role on the new table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.seller_bank_change_requests TO service_role;
