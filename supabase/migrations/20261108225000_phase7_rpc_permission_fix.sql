-- Fix approve_seller and approve_seller_bank_change_request permission checks to allow service_role and verified admin actor

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
  -- Permission check: superadmin or manage_sellers permission (checking current caller OR passed admin actor)
  IF NOT (
    current_user = 'service_role' OR
    COALESCE((SELECT private.is_superadmin()), false) OR 
    COALESCE((SELECT private.has_permission('manage_sellers')), false) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'superadmin') OR
    EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = p_admin_id AND permission = 'manage_sellers')
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

-- Fix approve_seller_bank_change_request
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
  -- Permission check: superadmin or manage_finance permission (checking current caller OR passed admin actor)
  IF NOT (
    current_user = 'service_role' OR
    COALESCE((SELECT private.is_superadmin()), false) OR 
    COALESCE((SELECT private.has_permission('manage_finance')), false) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'superadmin') OR
    EXISTS (SELECT 1 FROM public.admin_permissions WHERE user_id = p_admin_id AND permission = 'manage_finance')
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
      'request_id', p_request_id,
      'note', p_note
    ),
    p_ip_address
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_seller_bank_change_request(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_seller_bank_change_request(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;

