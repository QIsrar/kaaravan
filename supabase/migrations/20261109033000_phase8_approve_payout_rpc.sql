-- Migration: 20261109033000_phase8_approve_payout_rpc.sql
-- Description: Phase 8 Function 8 - Atomic RPC for approving seller payouts with row lock,
-- balance re-verification, negative ledger entry insertion, and audit trail.

CREATE OR REPLACE FUNCTION public.approve_payout(
  p_payout_id UUID,
  p_admin_id UUID,
  p_bank_reference TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT 'internal'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payout RECORD;
  v_available_balance BIGINT;
  v_total_balance BIGINT;
  v_new_balance BIGINT;
  v_payout_status public.payout_status;
BEGIN
  -- 1. Verify admin has manage_finance or is superadmin
  IF NOT (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'superadmin') OR
    EXISTS (SELECT 1 FROM public.admin_permissions WHERE profile_id = p_admin_id AND permission = 'manage_finance')
  ) THEN
    RAISE EXCEPTION 'Access denied: admin actor does not possess manage_finance permission';
  END IF;

  -- 2. Lock the payout row FOR UPDATE
  SELECT id, seller_id, amount_minor, status
  INTO v_payout
  FROM public.payouts
  WHERE id = p_payout_id
  FOR UPDATE;

  IF v_payout.id IS NULL THEN
    RAISE EXCEPTION 'Payout request not found';
  END IF;

  IF v_payout.status <> 'requested' THEN
    RAISE EXCEPTION 'Payout is not in requested status (current: %)', v_payout.status;
  END IF;

  -- 3. Lock the seller row FOR UPDATE to serialize concurrent financial operations
  PERFORM 1 FROM public.sellers WHERE id = v_payout.seller_id FOR UPDATE;

  -- 4. Re-calculate current balances from immutable ledger (balances = sums)
  SELECT 
    COALESCE(SUM(amount_minor) FILTER (WHERE available_at <= pg_catalog.now()), 0),
    COALESCE(SUM(amount_minor), 0)
  INTO v_available_balance, v_total_balance
  FROM public.seller_ledger
  WHERE seller_id = v_payout.seller_id;

  -- 5. Invariant: payout cannot exceed available balance
  IF v_payout.amount_minor > v_available_balance THEN
    RAISE EXCEPTION 'Payout amount (%) exceeds seller available balance (%)', 
      v_payout.amount_minor, v_available_balance;
  END IF;

  v_new_balance := v_total_balance - v_payout.amount_minor;
  v_payout_status := CASE 
    WHEN p_bank_reference IS NOT NULL AND length(trim(p_bank_reference)) > 0 THEN 'paid'::public.payout_status 
    ELSE 'approved'::public.payout_status 
  END;

  -- 6. Insert negative payout entry into seller_ledger
  INSERT INTO public.seller_ledger (
    seller_id,
    sub_order_id,
    entry_type,
    amount_minor,
    balance_after_minor,
    available_at,
    created_at
  ) VALUES (
    v_payout.seller_id,
    NULL,
    'payout',
    -v_payout.amount_minor,
    v_new_balance,
    pg_catalog.now(),
    pg_catalog.now()
  );

  -- 7. Update payout record status and reference (amount_minor remains locked)
  UPDATE public.payouts
  SET status = v_payout_status,
      bank_reference = p_bank_reference,
      paid_at = CASE WHEN v_payout_status = 'paid' THEN pg_catalog.now() ELSE NULL END,
      approved_by = p_admin_id,
      updated_at = pg_catalog.now()
  WHERE id = p_payout_id;

  -- 8. Append immutable audit log
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity,
    entity_id,
    before,
    after,
    ip
  ) VALUES (
    p_admin_id,
    'PAYOUT_APPROVED',
    'payouts',
    p_payout_id,
    jsonb_build_object('status', 'requested', 'amount_minor', v_payout.amount_minor),
    jsonb_build_object(
      'status', v_payout_status,
      'amount_minor', v_payout.amount_minor,
      'bank_reference', p_bank_reference,
      'balance_after_minor', v_new_balance,
      'available_balance_before', v_available_balance
    ),
    p_ip_address
  );

  RETURN jsonb_build_object(
    'success', true,
    'payout_id', p_payout_id,
    'amount_minor', v_payout.amount_minor,
    'status', v_payout_status,
    'balance_after_minor', v_new_balance
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_payout(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_payout(UUID, UUID, TEXT, TEXT) TO service_role;

-- Atomic RPC for rejecting a requested payout
CREATE OR REPLACE FUNCTION public.reject_payout(
  p_payout_id UUID,
  p_admin_id UUID,
  p_reason TEXT,
  p_ip_address TEXT DEFAULT 'internal'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payout RECORD;
BEGIN
  -- 1. Verify admin has manage_finance or is superadmin
  IF NOT (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'superadmin') OR
    EXISTS (SELECT 1 FROM public.admin_permissions WHERE profile_id = p_admin_id AND permission = 'manage_finance')
  ) THEN
    RAISE EXCEPTION 'Access denied: admin actor does not possess manage_finance permission';
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'A mandatory rejection reason of at least 5 characters is required';
  END IF;

  -- 2. Lock payout FOR UPDATE
  SELECT id, seller_id, amount_minor, status
  INTO v_payout
  FROM public.payouts
  WHERE id = p_payout_id
  FOR UPDATE;

  IF v_payout.id IS NULL THEN
    RAISE EXCEPTION 'Payout request not found';
  END IF;

  IF v_payout.status <> 'requested' THEN
    RAISE EXCEPTION 'Payout is not in requested status (current: %)', v_payout.status;
  END IF;

  -- 3. Update status to failed
  UPDATE public.payouts
  SET status = 'failed',
      approved_by = p_admin_id,
      updated_at = pg_catalog.now()
  WHERE id = p_payout_id;

  -- 4. Audit log
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity,
    entity_id,
    before,
    after,
    ip
  ) VALUES (
    p_admin_id,
    'PAYOUT_REJECTED',
    'payouts',
    p_payout_id,
    jsonb_build_object('status', 'requested', 'amount_minor', v_payout.amount_minor),
    jsonb_build_object('status', 'failed', 'reason', p_reason),
    p_ip_address
  );

  RETURN jsonb_build_object('success', true, 'payout_id', p_payout_id, 'status', 'failed');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_payout(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_payout(UUID, UUID, TEXT, TEXT) TO service_role;

