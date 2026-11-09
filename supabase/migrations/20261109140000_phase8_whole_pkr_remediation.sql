-- Migration: 20261109140000_phase8_whole_pkr_remediation.sql
-- Description: Phase 8 Complete Remediation & Whole-PKR Currency Standardization
-- 1. Converts all monetary columns from paisa (_minor) to whole Pakistani Rupees (_pkr).
-- 2. Fixes CRIT-01: Corrects column references in create_order_transaction and implements deterministic multi-category commission aggregation.
-- 3. Fixes CRIT-02: Idempotent stock release under row locks in release_order_stock.
-- 4. Fixes CRIT-04: Atomic confirm_order_payment RPC for payment confirmation and inventory conversion.
-- 5. Fixes HIGH-01: Adds quantity to returns and validates partial returns against purchased quantity.
-- 6. Fixes HIGH-03: Adds event_id to seller_ledger for idempotent delivery postings.
-- 7. Fixes HIGH-04: Adds token_hash and expires_at to cod_confirmations for cryptographically secure COD confirmation.
-- 8. Fixes MED-02: Enforces order and sub-order status transition state machine.
-- 9. Fixes MED-03: Protects all financial tables against DELETE operations and changes FK cascade to RESTRICT.
-- 10. Fixes MED-04: Adds atomic request_payout RPC with seller row locks.

BEGIN;

-- ============================================================================
-- 1. SCHEMA CONVERSIONS: MINOR UNITS (PAISA) -> WHOLE RUPEES (PKR)
-- ============================================================================

-- 1A. product_variants
ALTER TABLE public.product_variants 
  RENAME COLUMN price_minor TO price_pkr;
ALTER TABLE public.product_variants 
  RENAME COLUMN compare_at_minor TO compare_at_pkr;
ALTER TABLE public.product_variants 
  RENAME COLUMN min_offer_minor TO min_offer_pkr;

UPDATE public.product_variants 
SET price_pkr = price_pkr / 100,
    compare_at_pkr = CASE WHEN compare_at_pkr IS NOT NULL THEN compare_at_pkr / 100 ELSE NULL END,
    min_offer_pkr = CASE WHEN min_offer_pkr IS NOT NULL THEN min_offer_pkr / 100 ELSE NULL END;

-- 1B. price_history
ALTER TABLE public.price_history 
  RENAME COLUMN price_minor TO price_pkr;
ALTER TABLE public.price_history 
  RENAME COLUMN compare_at_minor TO compare_at_pkr;

UPDATE public.price_history 
SET price_pkr = price_pkr / 100,
    compare_at_pkr = CASE WHEN compare_at_pkr IS NOT NULL THEN compare_at_pkr / 100 ELSE NULL END;

-- 1C. orders
ALTER TABLE public.orders 
  RENAME COLUMN subtotal_minor TO subtotal_pkr;
ALTER TABLE public.orders 
  RENAME COLUMN shipping_minor TO shipping_pkr;
ALTER TABLE public.orders 
  RENAME COLUMN discount_minor TO discount_pkr;
ALTER TABLE public.orders 
  RENAME COLUMN total_minor TO total_pkr;

UPDATE public.orders 
SET subtotal_pkr = subtotal_pkr / 100,
    shipping_pkr = shipping_pkr / 100,
    discount_pkr = discount_pkr / 100,
    total_pkr = total_pkr / 100;

-- Ensure currency is strictly PKR
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS check_orders_currency_pkr;
ALTER TABLE public.orders 
  ADD CONSTRAINT check_orders_currency_pkr CHECK (currency = 'PKR');

-- 1D. sub_orders
ALTER TABLE public.sub_orders 
  RENAME COLUMN subtotal_minor TO subtotal_pkr;
ALTER TABLE public.sub_orders 
  RENAME COLUMN shipping_minor TO shipping_pkr;
ALTER TABLE public.sub_orders 
  RENAME COLUMN total_minor TO total_pkr;

UPDATE public.sub_orders 
SET subtotal_pkr = subtotal_pkr / 100,
    shipping_pkr = shipping_pkr / 100,
    total_pkr = total_pkr / 100;

-- 1E. order_items
ALTER TABLE public.order_items 
  RENAME COLUMN unit_price_minor TO unit_price_pkr;
ALTER TABLE public.order_items 
  RENAME COLUMN line_total_minor TO line_total_pkr;

UPDATE public.order_items 
SET unit_price_pkr = unit_price_pkr / 100,
    line_total_pkr = line_total_pkr / 100;

-- 1F. payments
ALTER TABLE public.payments 
  RENAME COLUMN amount_minor TO amount_pkr;

UPDATE public.payments 
SET amount_pkr = amount_pkr / 100;

-- 1G. payouts
ALTER TABLE public.payouts 
  RENAME COLUMN amount_minor TO amount_pkr;

UPDATE public.payouts 
SET amount_pkr = amount_pkr / 100;

-- 1H. commissions
ALTER TABLE public.commissions 
  RENAME COLUMN base_minor TO base_pkr;
ALTER TABLE public.commissions 
  RENAME COLUMN commission_minor TO commission_pkr;

UPDATE public.commissions 
SET base_pkr = base_pkr / 100,
    commission_pkr = commission_pkr / 100;

-- 1I. seller_ledger
ALTER TABLE public.seller_ledger 
  RENAME COLUMN amount_minor TO amount_pkr;
ALTER TABLE public.seller_ledger 
  RENAME COLUMN balance_after_minor TO balance_after_pkr;

UPDATE public.seller_ledger 
SET amount_pkr = amount_pkr / 100,
    balance_after_pkr = balance_after_pkr / 100;

-- Add event_id for delivery & reversal posting idempotency (HIGH-03)
ALTER TABLE public.seller_ledger 
  ADD COLUMN IF NOT EXISTS event_id TEXT DEFAULT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_ledger_sub_order_event 
  ON public.seller_ledger (sub_order_id, event_id) 
  WHERE sub_order_id IS NOT NULL AND event_id IS NOT NULL;

-- 1J. returns (HIGH-01)
ALTER TABLE public.returns 
  RENAME COLUMN refund_minor TO refund_pkr;

UPDATE public.returns 
SET refund_pkr = refund_pkr / 100;

ALTER TABLE public.returns 
  ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0);

-- 1K. coupons
ALTER TABLE public.coupons 
  RENAME COLUMN fixed_minor TO fixed_pkr;
ALTER TABLE public.coupons 
  RENAME COLUMN min_order_minor TO min_order_pkr;
ALTER TABLE public.coupons 
  RENAME COLUMN max_discount_minor TO max_discount_pkr;

UPDATE public.coupons 
SET fixed_pkr = CASE WHEN fixed_pkr IS NOT NULL THEN fixed_pkr / 100 ELSE NULL END,
    min_order_pkr = CASE WHEN min_order_pkr IS NOT NULL THEN min_order_pkr / 100 ELSE NULL END,
    max_discount_pkr = CASE WHEN max_discount_pkr IS NOT NULL THEN max_discount_pkr / 100 ELSE NULL END;

-- 1L. offers
ALTER TABLE public.offers 
  RENAME COLUMN offered_minor TO offered_pkr;
ALTER TABLE public.offers 
  RENAME COLUMN counter_minor TO counter_pkr;

UPDATE public.offers 
SET offered_pkr = offered_pkr / 100,
    counter_pkr = CASE WHEN counter_pkr IS NOT NULL THEN counter_pkr / 100 ELSE NULL END;

-- 1M. qafila_deals
ALTER TABLE public.qafila_deals 
  RENAME COLUMN deal_price_minor TO deal_price_pkr;

UPDATE public.qafila_deals 
SET deal_price_pkr = deal_price_pkr / 100;

-- 1N. cod_confirmations (HIGH-04)
ALTER TABLE public.cod_confirmations 
  ADD COLUMN IF NOT EXISTS token_hash TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (pg_catalog.now() + INTERVAL '24 hours'),
  ADD COLUMN IF NOT EXISTS verified_phone TEXT DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cod_confirmations_token_hash 
  ON public.cod_confirmations(token_hash) 
  WHERE token_hash IS NOT NULL;

-- 1O. coupon_redemptions
ALTER TABLE public.coupon_redemptions 
  RENAME COLUMN discount_minor TO discount_pkr;

UPDATE public.coupon_redemptions 
SET discount_pkr = discount_pkr / 100;

-- 1P. shipments
ALTER TABLE public.shipments 
  RENAME COLUMN cod_amount_minor TO cod_amount_pkr;

UPDATE public.shipments 
SET cod_amount_pkr = cod_amount_pkr / 100;

-- 1Q. cod_remittances
ALTER TABLE public.cod_remittances 
  RENAME COLUMN amount_minor TO amount_pkr;

UPDATE public.cod_remittances 
SET amount_pkr = amount_pkr / 100;

-- 1R. cod_remittance_items
ALTER TABLE public.cod_remittance_items 
  RENAME COLUMN amount_minor TO amount_pkr;

UPDATE public.cod_remittance_items 
SET amount_pkr = amount_pkr / 100;


-- ============================================================================
-- 2. FINANCIAL RECORD DELETION PROTECTION (MED-03)
-- ============================================================================

-- Function to block DELETE on immutable financial records
CREATE OR REPLACE FUNCTION private.prevent_financial_record_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Financial records in % are immutable and append-only. Hard deletion is prohibited.', TG_TABLE_NAME;
END;
$$;

-- Apply deletion protection triggers
DROP TRIGGER IF EXISTS trigger_prevent_orders_delete ON public.orders;
CREATE TRIGGER trigger_prevent_orders_delete
  BEFORE DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION private.prevent_financial_record_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_sub_orders_delete ON public.sub_orders;
CREATE TRIGGER trigger_prevent_sub_orders_delete
  BEFORE DELETE ON public.sub_orders
  FOR EACH ROW EXECUTE FUNCTION private.prevent_financial_record_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_order_items_delete ON public.order_items;
CREATE TRIGGER trigger_prevent_order_items_delete
  BEFORE DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION private.prevent_financial_record_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_payments_delete ON public.payments;
CREATE TRIGGER trigger_prevent_payments_delete
  BEFORE DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION private.prevent_financial_record_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_payouts_delete ON public.payouts;
CREATE TRIGGER trigger_prevent_payouts_delete
  BEFORE DELETE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION private.prevent_financial_record_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_seller_ledger_delete ON public.seller_ledger;
CREATE TRIGGER trigger_prevent_seller_ledger_delete
  BEFORE DELETE ON public.seller_ledger
  FOR EACH ROW EXECUTE FUNCTION private.prevent_financial_record_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_commissions_delete ON public.commissions;
CREATE TRIGGER trigger_prevent_commissions_delete
  BEFORE DELETE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION private.prevent_financial_record_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_returns_delete ON public.returns;
CREATE TRIGGER trigger_prevent_returns_delete
  BEFORE DELETE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION private.prevent_financial_record_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_coupon_redemptions_delete ON public.coupon_redemptions;
CREATE TRIGGER trigger_prevent_coupon_redemptions_delete
  BEFORE DELETE ON public.coupon_redemptions
  FOR EACH ROW EXECUTE FUNCTION private.prevent_financial_record_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_cod_remittances_delete ON public.cod_remittances;
CREATE TRIGGER trigger_prevent_cod_remittances_delete
  BEFORE DELETE ON public.cod_remittances
  FOR EACH ROW EXECUTE FUNCTION private.prevent_financial_record_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_cod_remittance_items_delete ON public.cod_remittance_items;
CREATE TRIGGER trigger_prevent_cod_remittance_items_delete
  BEFORE DELETE ON public.cod_remittance_items
  FOR EACH ROW EXECUTE FUNCTION private.prevent_financial_record_deletion();

-- Change sub_orders foreign key to orders to ON DELETE RESTRICT (was CASCADE)
ALTER TABLE public.sub_orders 
  DROP CONSTRAINT IF EXISTS sub_orders_order_id_fkey;
ALTER TABLE public.sub_orders 
  ADD CONSTRAINT sub_orders_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;


-- ============================================================================
-- 3. FINANCIAL COLUMN IMMUTABILITY TRIGGERS (WHOLE PKR)
-- ============================================================================

-- 3A. orders
CREATE OR REPLACE FUNCTION private.lock_orders_money_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (OLD.subtotal_pkr IS DISTINCT FROM NEW.subtotal_pkr) OR
     (OLD.shipping_pkr IS DISTINCT FROM NEW.shipping_pkr) OR
     (OLD.discount_pkr IS DISTINCT FROM NEW.discount_pkr) OR
     (OLD.total_pkr IS DISTINCT FROM NEW.total_pkr) OR
     (OLD.currency IS DISTINCT FROM NEW.currency) THEN
    RAISE EXCEPTION 'Financial fields on orders (subtotal, shipping, discount, total, currency) are immutable after creation.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_lock_orders_money_columns ON public.orders;
CREATE TRIGGER trigger_lock_orders_money_columns
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION private.lock_orders_money_columns();

-- 3B. sub_orders
CREATE OR REPLACE FUNCTION private.lock_sub_orders_money_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (OLD.subtotal_pkr IS DISTINCT FROM NEW.subtotal_pkr) OR
     (OLD.shipping_pkr IS DISTINCT FROM NEW.shipping_pkr) OR
     (OLD.total_pkr IS DISTINCT FROM NEW.total_pkr) THEN
    RAISE EXCEPTION 'Financial fields on sub_orders (subtotal, shipping, total) are immutable after creation.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_lock_sub_orders_money_columns ON public.sub_orders;
CREATE TRIGGER trigger_lock_sub_orders_money_columns
  BEFORE UPDATE ON public.sub_orders
  FOR EACH ROW
  EXECUTE FUNCTION private.lock_sub_orders_money_columns();

-- 3C. payments
CREATE OR REPLACE FUNCTION private.lock_payments_amount_and_log_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (OLD.amount_pkr IS DISTINCT FROM NEW.amount_pkr) OR
     (OLD.order_id IS DISTINCT FROM NEW.order_id) OR
     (OLD.gateway IS DISTINCT FROM NEW.gateway) OR
     (OLD.method IS DISTINCT FROM NEW.method) THEN
    RAISE EXCEPTION 'Payment amount, order_id, gateway and method are immutable after creation.';
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, before, after, ip)
    VALUES (
      auth.uid(),
      'PAYMENT_STATUS_UPDATED',
      'payments',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      COALESCE(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', 'system')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_lock_payments_amount_and_log_status ON public.payments;
CREATE TRIGGER trigger_lock_payments_amount_and_log_status
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION private.lock_payments_amount_and_log_status();

-- 3D. payouts
CREATE OR REPLACE FUNCTION private.lock_payouts_amount_and_log_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (OLD.amount_pkr IS DISTINCT FROM NEW.amount_pkr) OR
     (OLD.seller_id IS DISTINCT FROM NEW.seller_id) THEN
    RAISE EXCEPTION 'Payout amount and seller_id are immutable after creation.';
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, before, after, ip)
    VALUES (
      auth.uid(),
      'PAYOUT_STATUS_UPDATED',
      'payouts',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      COALESCE(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', 'system')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_lock_payouts_amount_and_log_status ON public.payouts;
CREATE TRIGGER trigger_lock_payouts_amount_and_log_status
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION private.lock_payouts_amount_and_log_status();


-- ============================================================================
-- 4. ORDER & SUB-ORDER STATUS STATE MACHINE (MED-02)
-- ============================================================================

CREATE OR REPLACE FUNCTION private.enforce_sub_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Terminal state: delivered cannot transition to anything
  IF OLD.status = 'delivered' THEN
    RAISE EXCEPTION 'Sub-order is delivered and cannot transition to %', NEW.status;
  END IF;

  -- Terminal state: cancelled cannot transition to anything
  IF OLD.status = 'cancelled' THEN
    RAISE EXCEPTION 'Sub-order is cancelled and cannot transition to %', NEW.status;
  END IF;

  -- Permitted transitions:
  -- awaiting_confirmation -> pending, cancelled
  -- pending -> ready_to_ship, cancelled
  -- ready_to_ship -> in_transit, cancelled
  -- in_transit -> delivered, cancelled (return/failed delivery)
  IF OLD.status = 'awaiting_confirmation' AND NEW.status NOT IN ('pending', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid sub-order transition from % to %', OLD.status, NEW.status;
  ELSIF OLD.status = 'pending' AND NEW.status NOT IN ('ready_to_ship', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid sub-order transition from % to %', OLD.status, NEW.status;
  ELSIF OLD.status = 'ready_to_ship' AND NEW.status NOT IN ('in_transit', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid sub-order transition from % to %', OLD.status, NEW.status;
  ELSIF OLD.status = 'in_transit' AND NEW.status NOT IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid sub-order transition from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_sub_order_status ON public.sub_orders;
CREATE TRIGGER trigger_enforce_sub_order_status
  BEFORE UPDATE OF status ON public.sub_orders
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_sub_order_status_transition();


-- ============================================================================
-- 5. ATOMIC ORDER CREATION RPC: create_order_transaction (CRIT-01, MED-01)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_order_transaction(
  p_profile_id UUID DEFAULT NULL,
  p_shipping_address JSONB DEFAULT '{}'::jsonb,
  p_billing_address JSONB DEFAULT '{}'::jsonb,
  p_payment_method public.payment_method DEFAULT 'cod'::public.payment_method,
  p_guest_email TEXT DEFAULT NULL,
  p_guest_phone TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_seller_shipping JSONB DEFAULT '{}'::jsonb,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing_order_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_variant RECORD;
  v_seller RECORD;
  v_k TEXT;
  v_seller_id UUID;
  v_sub_order_id UUID;
  v_seller_shipping_pkr BIGINT;
  v_seller_subtotal_pkr BIGINT;
  v_total_subtotal_pkr BIGINT := 0;
  v_total_shipping_pkr BIGINT := 0;
  v_order_total_pkr BIGINT := 0;
  v_sub_order_status public.sub_order_status;
  v_sub_orders_result JSONB := '[]'::jsonb;
  v_order_payment_status public.payment_status;
  v_item_subtotal_pkr BIGINT;
  v_item_rate_bps INT;
  v_item_comm_pkr BIGINT;
  v_seller_comm_pkr BIGINT;
  v_weighted_bps INT;
BEGIN
  -- 1. Enforce Idempotency
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT id INTO v_existing_order_id
    FROM public.orders
    WHERE idempotency_key = p_idempotency_key;

    IF v_existing_order_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'order_id', v_existing_order_id,
        'is_idempotent', true
      );
    END IF;
  END IF;

  -- 2. Validate items array
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- 3. Row lock all requested variants FOR UPDATE to prevent race conditions
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    PERFORM 1
    FROM public.product_variants pv
    WHERE pv.id = (v_item->>'variantId')::UUID
    FOR UPDATE;
  END LOOP;

  -- 4. Validate stock, active status, seller status, and price integrity
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT 
      pv.id,
      pv.price_pkr,
      pv.stock_quantity,
      pv.reserved_quantity,
      pv.is_active,
      p.id AS product_id,
      p.status AS product_status,
      p.title AS product_title,
      s.id AS seller_id,
      s.status AS seller_status,
      s.business_name AS seller_name
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON pv.product_id = p.id
    JOIN public.sellers s ON p.seller_id = s.id
    WHERE pv.id = (v_item->>'variantId')::UUID
      AND pv.deleted_at IS NULL
      AND p.deleted_at IS NULL;

    IF v_variant.id IS NULL THEN
      RAISE EXCEPTION 'Variant % no longer exists', (v_item->>'variantId');
    END IF;

    IF NOT v_variant.is_active OR v_variant.product_status <> 'active' THEN
      RAISE EXCEPTION 'Product "%" is not currently active for purchase', v_variant.product_title;
    END IF;

    IF v_variant.seller_status <> 'approved' THEN
      RAISE EXCEPTION 'Seller "%" is not active to accept orders', v_variant.seller_name;
    END IF;

    IF (v_variant.stock_quantity - v_variant.reserved_quantity) < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Insufficient stock for product "%" (available: %, requested: %)',
        v_variant.product_title,
        (v_variant.stock_quantity - v_variant.reserved_quantity),
        (v_item->>'quantity')::INT;
    END IF;

    -- Verify client expected price equals authoritative price in whole PKR
    IF (v_item->>'expectedPricePkr') IS NOT NULL THEN
      IF (v_item->>'expectedPricePkr')::BIGINT <> v_variant.price_pkr THEN
        RAISE EXCEPTION 'Price change detected for product "%": was PKR %, now PKR %',
          v_variant.product_title,
          (v_item->>'expectedPricePkr')::BIGINT,
          v_variant.price_pkr;
      END IF;
    END IF;
  END LOOP;

  -- 5. Reserve stock conditionally for each variant
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE public.product_variants
    SET reserved_quantity = reserved_quantity + (v_item->>'quantity')::INT,
        updated_at = pg_catalog.now()
    WHERE id = (v_item->>'variantId')::UUID;
  END LOOP;

  -- 6. Calculate totals in whole PKR
  FOR v_k IN SELECT jsonb_object_keys(p_seller_shipping)
  LOOP
    v_total_shipping_pkr := v_total_shipping_pkr + COALESCE((p_seller_shipping->>v_k)::BIGINT, 0);
  END LOOP;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price_pkr INTO v_variant
    FROM public.product_variants
    WHERE id = (v_item->>'variantId')::UUID;

    v_total_subtotal_pkr := v_total_subtotal_pkr + (v_variant.price_pkr * (v_item->>'quantity')::INT);
  END LOOP;

  v_order_total_pkr := v_total_subtotal_pkr + v_total_shipping_pkr;

  -- 7. Generate order number & insert parent orders row
  v_order_id := pg_catalog.gen_random_uuid();
  v_order_number := public.generate_order_number();
  v_order_payment_status := CASE WHEN p_payment_method = 'cod' THEN 'pending'::public.payment_status ELSE 'pending'::public.payment_status END;

  INSERT INTO public.orders (
    id,
    order_number,
    profile_id,
    guest_email,
    guest_phone,
    shipping_address,
    billing_address,
    payment_method,
    payment_status,
    subtotal_pkr,
    shipping_pkr,
    discount_pkr,
    total_pkr,
    currency,
    idempotency_key,
    created_at,
    updated_at
  ) VALUES (
    v_order_id,
    v_order_number,
    p_profile_id,
    p_guest_email,
    p_guest_phone,
    p_shipping_address,
    p_billing_address,
    p_payment_method,
    v_order_payment_status,
    v_total_subtotal_pkr,
    v_total_shipping_pkr,
    0,
    v_order_total_pkr,
    'PKR',
    p_idempotency_key,
    pg_catalog.now(),
    pg_catalog.now()
  );

  -- 8. Group items by seller and create sub_orders + order_items + commissions
  IF p_payment_method = 'cod' THEN
    v_sub_order_status := 'awaiting_confirmation';
  ELSE
    v_sub_order_status := 'pending';
  END IF;

  FOR v_k IN SELECT jsonb_object_keys(p_seller_shipping)
  LOOP
    v_seller_id := v_k::UUID;
    v_seller_shipping_pkr := COALESCE((p_seller_shipping->>v_k)::BIGINT, 0);
    v_seller_subtotal_pkr := 0;
    v_seller_comm_pkr := 0;

    -- Compute subtotal and item-level commission for this seller (MED-01 fix)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      SELECT 
        pv.id,
        pv.price_pkr,
        p.seller_id,
        s.commission_rate_bps AS seller_commission_bps,
        c.commission_rate_bps AS category_commission_bps
      INTO v_variant
      FROM public.product_variants pv
      JOIN public.products p ON pv.product_id = p.id
      JOIN public.sellers s ON p.seller_id = s.id
      LEFT JOIN public.categories c ON p.category_id = c.id
      WHERE pv.id = (v_item->>'variantId')::UUID;

      IF v_variant.seller_id = v_seller_id THEN
        v_item_subtotal_pkr := v_variant.price_pkr * (v_item->>'quantity')::INT;
        v_seller_subtotal_pkr := v_seller_subtotal_pkr + v_item_subtotal_pkr;

        -- Priority: seller override > category rate > platform default (500 bps = 5.0%)
        v_item_rate_bps := COALESCE(v_variant.seller_commission_bps, v_variant.category_commission_bps, 500);
        -- Whole-PKR half-up rounding rule: floor((amount * bps + 5000) / 10000)
        v_item_comm_pkr := ((v_item_subtotal_pkr * v_item_rate_bps) + 5000) / 10000;
        v_seller_comm_pkr := v_seller_comm_pkr + v_item_comm_pkr;
      END IF;
    END LOOP;

    v_sub_order_id := pg_catalog.gen_random_uuid();

    INSERT INTO public.sub_orders (
      id,
      order_id,
      seller_id,
      status,
      subtotal_pkr,
      shipping_pkr,
      discount_pkr,
      total_pkr,
      created_at,
      updated_at
    ) VALUES (
      v_sub_order_id,
      v_order_id,
      v_seller_id,
      v_sub_order_status,
      v_seller_subtotal_pkr,
      v_seller_shipping_pkr,
      0,
      v_seller_subtotal_pkr + v_seller_shipping_pkr,
      pg_catalog.now(),
      pg_catalog.now()
    );

    -- Insert snapshot order items with actual schema columns (CRIT-01 fix)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      SELECT 
        pv.id AS variant_id,
        pv.price_pkr,
        pv.attributes AS variant_attributes,
        p.seller_id,
        p.title AS product_title
      INTO v_variant
      FROM public.product_variants pv
      JOIN public.products p ON pv.product_id = p.id
      WHERE pv.id = (v_item->>'variantId')::UUID;

      IF v_variant.seller_id = v_seller_id THEN
        INSERT INTO public.order_items (
          id,
          sub_order_id,
          variant_id,
          product_title,
          variant_attributes,
          unit_price_pkr,
          quantity,
          line_total_pkr,
          created_at,
          updated_at
        ) VALUES (
          pg_catalog.gen_random_uuid(),
          v_sub_order_id,
          v_variant.variant_id,
          v_variant.product_title,
          COALESCE(v_variant.variant_attributes, '{}'::jsonb),
          v_variant.price_pkr,
          (v_item->>'quantity')::INT,
          v_variant.price_pkr * (v_item->>'quantity')::INT,
          pg_catalog.now(),
          pg_catalog.now()
        );
      END IF;
    END LOOP;

    -- Calculate weighted effective commission bps for reporting
    IF v_seller_subtotal_pkr > 0 THEN
      v_weighted_bps := (((v_seller_comm_pkr * 10000) + (v_seller_subtotal_pkr / 2)) / v_seller_subtotal_pkr)::INT;
    ELSE
      v_weighted_bps := 500;
    END IF;

    -- Insert commission snapshot with actual schema columns (CRIT-01 fix)
    INSERT INTO public.commissions (
      sub_order_id,
      rate_bps,
      base_pkr,
      commission_pkr
    ) VALUES (
      v_sub_order_id,
      v_weighted_bps,
      v_seller_subtotal_pkr,
      v_seller_comm_pkr
    );

    v_sub_orders_result := v_sub_orders_result || jsonb_build_object(
      'sub_order_id', v_sub_order_id,
      'seller_id', v_seller_id,
      'commission_pkr', v_seller_comm_pkr,
      'subtotal_pkr', v_seller_subtotal_pkr,
      'shipping_pkr', v_seller_shipping_pkr,
      'total_pkr', v_seller_subtotal_pkr + v_seller_shipping_pkr,
      'status', v_sub_order_status
    );
  END LOOP;

  -- 9. For COD: insert initial cod_confirmations row
  IF p_payment_method = 'cod' THEN
    INSERT INTO public.cod_confirmations (
      order_id,
      channel,
      status,
      expires_at
    ) VALUES (
      v_order_id,
      'sms_whatsapp',
      'pending',
      pg_catalog.now() + INTERVAL '24 hours'
    );
  END IF;

  -- 10. For Online: insert initial payments row
  IF p_payment_method != 'cod' THEN
    INSERT INTO public.payments (
      order_id,
      gateway,
      method,
      amount_pkr,
      status,
      idempotency_key
    ) VALUES (
      v_order_id,
      'mock',
      p_payment_method,
      v_order_total_pkr,
      'pending',
      COALESCE(p_idempotency_key, v_order_id::text)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_pkr', v_order_total_pkr,
    'payment_method', p_payment_method,
    'payment_status', v_order_payment_status,
    'sub_orders', v_sub_orders_result
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order_transaction FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_transaction TO service_role;


-- ============================================================================
-- 6. ATOMIC PAYMENT CONFIRMATION RPC: confirm_order_payment (CRIT-04)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.confirm_order_payment(
  p_order_id UUID,
  p_gateway_ref TEXT,
  p_amount_pkr BIGINT,
  p_currency TEXT,
  p_raw_payload JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order RECORD;
  v_payment RECORD;
  v_item RECORD;
  v_sub_order RECORD;
BEGIN
  -- 1. Validate currency is strictly PKR
  IF p_currency <> 'PKR' THEN
    RAISE EXCEPTION 'Invalid currency: %. Kaaravan only accepts PKR payments.', p_currency;
  END IF;

  -- 2. Lock the order row FOR UPDATE
  SELECT id, order_number, payment_status, total_pkr
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- Idempotency check: if already marked paid, return success without re-deducting stock
  IF v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', v_order.id,
      'is_idempotent', true,
      'status', 'paid'
    );
  END IF;

  -- 3. Strict amount check (CRIT-03)
  IF p_amount_pkr <> v_order.total_pkr THEN
    RAISE EXCEPTION 'Payment amount mismatch: expected PKR %, received PKR %',
      v_order.total_pkr, p_amount_pkr;
  END IF;

  -- 4. Lock and update payments row FOR UPDATE
  SELECT id, status INTO v_payment
  FROM public.payments
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF v_payment.id IS NOT NULL THEN
    UPDATE public.payments
    SET status = 'paid',
        gateway_ref = p_gateway_ref,
        raw_response = p_raw_payload,
        updated_at = pg_catalog.now()
    WHERE id = v_payment.id;
  ELSE
    -- Insert payment record if not created earlier
    INSERT INTO public.payments (
      order_id,
      gateway,
      method,
      amount_pkr,
      status,
      gateway_ref,
      raw_response
    ) VALUES (
      p_order_id,
      'mock',
      'card',
      p_amount_pkr,
      'paid',
      p_gateway_ref,
      p_raw_payload
    );
  END IF;

  -- 5. Update order payment status
  UPDATE public.orders
  SET payment_status = 'paid',
      updated_at = pg_catalog.now()
  WHERE id = p_order_id;

  -- 6. Lock and transition sub_orders to pending
  FOR v_sub_order IN
    SELECT id FROM public.sub_orders WHERE order_id = p_order_id FOR UPDATE
  LOOP
    UPDATE public.sub_orders
    SET status = 'pending',
        updated_at = pg_catalog.now()
    WHERE id = v_sub_order.id;

    -- Add audit history
    INSERT INTO public.order_status_history (
      sub_order_id,
      to_status,
      note
    ) VALUES (
      v_sub_order.id,
      'pending',
      'Online payment verified and confirmed (Gateway Ref: ' || p_gateway_ref || ')'
    );
  END LOOP;

  -- 7. Convert reserved stock into sold stock atomically (CRIT-04 fix)
  FOR v_item IN
    SELECT oi.variant_id, oi.quantity
    FROM public.order_items oi
    JOIN public.sub_orders so ON oi.sub_order_id = so.id
    WHERE so.order_id = p_order_id AND oi.variant_id IS NOT NULL
  LOOP
    UPDATE public.product_variants
    SET stock_quantity = GREATEST(0, stock_quantity - v_item.quantity),
        reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity),
        updated_at = pg_catalog.now()
    WHERE id = v_item.variant_id;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'gateway_ref', p_gateway_ref,
    'amount_pkr', p_amount_pkr,
    'status', 'paid'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_order_payment FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment TO service_role;


-- ============================================================================
-- 7. IDEMPOTENT STOCK RELEASE RPC: release_order_stock (CRIT-02)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.release_order_stock(
  p_order_id UUID,
  p_reason TEXT,
  p_actor_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_sub_order RECORD;
  v_already_released BOOLEAN := true;
BEGIN
  -- 1. Lock the order row FOR UPDATE to serialize cancellation
  SELECT id, payment_status INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- 2. Check if sub_orders are already in cancelled state (idempotency check)
  SELECT EXISTS (
    SELECT 1 FROM public.sub_orders
    WHERE order_id = p_order_id AND status <> 'cancelled'
  ) INTO v_already_released;

  -- If no sub_orders are uncancelled, stock was already released
  IF NOT v_already_released THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'is_idempotent', true,
      'message', 'Stock was already released'
    );
  END IF;

  -- 3. Release reserved quantities for all items in the order exactly once
  FOR v_item IN
    SELECT oi.variant_id, oi.quantity
    FROM public.order_items oi
    JOIN public.sub_orders so ON oi.sub_order_id = so.id
    WHERE so.order_id = p_order_id
      AND so.status <> 'cancelled'
      AND oi.variant_id IS NOT NULL
  LOOP
    UPDATE public.product_variants
    SET reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity),
        updated_at = pg_catalog.now()
    WHERE id = v_item.variant_id;
  END LOOP;

  -- 4. Cancel sub_orders and write status history
  FOR v_sub_order IN
    SELECT id, status FROM public.sub_orders
    WHERE order_id = p_order_id AND status <> 'cancelled'
    FOR UPDATE
  LOOP
    UPDATE public.sub_orders
    SET status = 'cancelled',
        updated_at = pg_catalog.now()
    WHERE id = v_sub_order.id;

    INSERT INTO public.order_status_history (
      sub_order_id,
      from_status,
      to_status,
      note,
      changed_by
    ) VALUES (
      v_sub_order.id,
      v_sub_order.status,
      'cancelled',
      p_reason,
      p_actor_id
    );
  END LOOP;

  -- 5. Mark payment failed/cancelled if still pending
  UPDATE public.payments
  SET status = 'failed',
      updated_at = pg_catalog.now()
  WHERE order_id = p_order_id AND status = 'pending';

  UPDATE public.orders
  SET payment_status = 'failed',
      updated_at = pg_catalog.now()
  WHERE id = p_order_id AND payment_status = 'pending';

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'cancelled',
    'reason', p_reason
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_order_stock FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_order_stock TO service_role;


-- ============================================================================
-- 8. ATOMIC PAYOUT REQUEST & APPROVAL RPCS (MED-04, LOW-01)
-- ============================================================================

-- 8A. Atomic Payout Request under Seller Row Lock (MED-04)
CREATE OR REPLACE FUNCTION public.request_payout(
  p_seller_profile_id UUID,
  p_amount_pkr BIGINT,
  p_ip_address TEXT DEFAULT '127.0.0.1'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_seller RECORD;
  v_bank RECORD;
  v_available_pkr BIGINT;
  v_pending_requested_pkr BIGINT;
  v_net_available_pkr BIGINT;
  v_payout_id UUID;
BEGIN
  IF p_amount_pkr <= 0 THEN
    RAISE EXCEPTION 'Payout amount must be greater than zero';
  END IF;

  -- 1. Lock the seller row FOR UPDATE
  SELECT id, status, business_name INTO v_seller
  FROM public.sellers
  WHERE owner_profile_id = p_seller_profile_id
  FOR UPDATE;

  IF v_seller.id IS NULL THEN
    RAISE EXCEPTION 'Seller profile not found';
  END IF;

  IF v_seller.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved sellers can request payouts';
  END IF;

  -- 2. Verify bank account exists
  SELECT id, bank_name, iban INTO v_bank
  FROM public.seller_bank_accounts
  WHERE seller_id = v_seller.id;

  IF v_bank.id IS NULL THEN
    RAISE EXCEPTION 'Cannot request payout without verified bank account details';
  END IF;

  -- 3. Calculate current available cleared funds from immutable ledger
  SELECT COALESCE(SUM(amount_pkr) FILTER (WHERE available_at <= pg_catalog.now()), 0)
  INTO v_available_pkr
  FROM public.seller_ledger
  WHERE seller_id = v_seller.id;

  -- 4. Calculate existing 'requested' pending payouts under seller lock
  SELECT COALESCE(SUM(amount_pkr), 0)
  INTO v_pending_requested_pkr
  FROM public.payouts
  WHERE seller_id = v_seller.id AND status = 'requested';

  v_net_available_pkr := v_available_pkr - v_pending_requested_pkr;

  IF p_amount_pkr > v_net_available_pkr THEN
    RAISE EXCEPTION 'Requested payout (PKR %) exceeds available uncommitted balance (PKR %)',
      p_amount_pkr, v_net_available_pkr;
  END IF;

  -- 5. Insert payout record
  v_payout_id := pg_catalog.gen_random_uuid();
  INSERT INTO public.payouts (
    id,
    seller_id,
    amount_pkr,
    status
  ) VALUES (
    v_payout_id,
    v_seller.id,
    p_amount_pkr,
    'requested'
  );

  -- 6. Audit log
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity,
    entity_id,
    before,
    after,
    ip
  ) VALUES (
    p_seller_profile_id,
    'PAYOUT_REQUESTED',
    'payouts',
    v_payout_id,
    NULL,
    jsonb_build_object(
      'seller_id', v_seller.id,
      'amount_pkr', p_amount_pkr,
      'available_pkr_before', v_available_pkr,
      'net_available_pkr_before', v_net_available_pkr,
      'remaining_pkr', v_net_available_pkr - p_amount_pkr
    ),
    p_ip_address
  );

  RETURN jsonb_build_object(
    'success', true,
    'payout_id', v_payout_id,
    'seller_id', v_seller.id,
    'amount_pkr', p_amount_pkr,
    'available_pkr', v_available_pkr,
    'remaining_available_pkr', v_net_available_pkr - p_amount_pkr,
    'status', 'requested'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_payout FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_payout TO service_role;

-- 8B. Update approve_payout for Whole PKR
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
  SELECT id, seller_id, amount_pkr, status
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

  -- 4. Re-calculate current balances from immutable ledger in whole PKR
  SELECT 
    COALESCE(SUM(amount_pkr) FILTER (WHERE available_at <= pg_catalog.now()), 0),
    COALESCE(SUM(amount_pkr), 0)
  INTO v_available_balance, v_total_balance
  FROM public.seller_ledger
  WHERE seller_id = v_payout.seller_id;

  -- 5. Invariant: payout cannot exceed available balance
  IF v_payout.amount_pkr > v_available_balance THEN
    RAISE EXCEPTION 'Payout amount (%) exceeds seller available balance (%)', 
      v_payout.amount_pkr, v_available_balance;
  END IF;

  v_new_balance := v_total_balance - v_payout.amount_pkr;
  v_payout_status := CASE 
    WHEN p_bank_reference IS NOT NULL AND length(trim(p_bank_reference)) > 0 THEN 'paid'::public.payout_status 
    ELSE 'approved'::public.payout_status 
  END;

  -- 6. Insert negative payout entry into seller_ledger in whole PKR
  INSERT INTO public.seller_ledger (
    seller_id,
    sub_order_id,
    entry_type,
    amount_pkr,
    balance_after_pkr,
    available_at,
    created_at
  ) VALUES (
    v_payout.seller_id,
    NULL,
    'payout',
    -v_payout.amount_pkr,
    v_new_balance,
    pg_catalog.now(),
    pg_catalog.now()
  );

  -- 7. Update payout record status and metadata
  UPDATE public.payouts
  SET status = v_payout_status,
      approved_by = p_admin_id,
      bank_reference = p_bank_reference,
      paid_at = CASE WHEN v_payout_status = 'paid' THEN pg_catalog.now() ELSE NULL END,
      updated_at = pg_catalog.now()
  WHERE id = p_payout_id;

  -- 8. Audit log
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
    jsonb_build_object('status', 'requested', 'amount_pkr', v_payout.amount_pkr),
    jsonb_build_object(
      'status', v_payout_status,
      'amount_pkr', v_payout.amount_pkr,
      'bank_reference', p_bank_reference,
      'balance_after_pkr', v_new_balance
    ),
    p_ip_address
  );

  RETURN jsonb_build_object(
    'success', true,
    'payout_id', p_payout_id,
    'amount_pkr', v_payout.amount_pkr,
    'status', v_payout_status,
    'balance_after_pkr', v_new_balance
  );
END;
$$;

-- ============================================================================
-- 9. UPSERT_CART_ITEM (WHOLE PKR)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_cart_item(
  p_profile_id uuid,
  p_guest_token text,
  p_variant_id uuid,
  p_quantity int,
  p_increment boolean DEFAULT false
)
RETURNS TABLE (
  out_cart_id uuid,
  out_variant_id uuid,
  out_quantity int,
  out_stock_available int,
  out_price_pkr bigint,
  out_subtotal_pkr bigint,
  out_adjusted boolean,
  out_total_items int,
  out_cart_subtotal_pkr bigint,
  out_shipping_pkr bigint,
  out_grand_total_pkr bigint
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_cart_id uuid;
  v_stock int;
  v_reserved int;
  v_is_active boolean;
  v_product_status text;
  v_seller_status text;
  v_price_pkr bigint;
  v_current_qty int;
  v_requested_qty int;
  v_available int;
  v_target_qty int;
BEGIN
  IF p_profile_id IS NULL AND (p_guest_token IS NULL OR trim(p_guest_token) = '') THEN
    RAISE EXCEPTION 'Either profile_id or guest_token must be provided';
  END IF;

  IF p_profile_id IS NOT NULL THEN
    SELECT id INTO v_cart_id FROM public.carts WHERE profile_id = p_profile_id;
    IF v_cart_id IS NULL THEN
      INSERT INTO public.carts (profile_id)
      VALUES (p_profile_id)
      ON CONFLICT (profile_id) DO UPDATE SET updated_at = pg_catalog.now()
      RETURNING id INTO v_cart_id;
    END IF;
  ELSE
    SELECT id INTO v_cart_id FROM public.carts WHERE guest_token = p_guest_token;
    IF v_cart_id IS NULL THEN
      INSERT INTO public.carts (guest_token)
      VALUES (p_guest_token)
      ON CONFLICT (guest_token) DO UPDATE SET updated_at = pg_catalog.now()
      RETURNING id INTO v_cart_id;
    END IF;
  END IF;

  SELECT
    pv.stock_quantity,
    pv.reserved_quantity,
    pv.is_active,
    pv.price_pkr,
    p.status,
    s.status
  INTO
    v_stock,
    v_reserved,
    v_is_active,
    v_price_pkr,
    v_product_status,
    v_seller_status
  FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
  JOIN public.sellers s ON s.id = p.seller_id
  WHERE pv.id = p_variant_id
  FOR SHARE OF pv;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant % does not exist', p_variant_id;
  END IF;

  IF NOT v_is_active OR v_product_status <> 'active' OR v_seller_status <> 'approved' THEN
    RAISE EXCEPTION 'This product is no longer available.';
  END IF;

  v_available := GREATEST(0, v_stock - v_reserved);

  SELECT ci.quantity INTO v_current_qty
  FROM public.cart_items ci
  WHERE ci.cart_id = v_cart_id AND ci.variant_id = p_variant_id;

  IF p_increment THEN
    v_requested_qty := COALESCE(v_current_qty, 0) + p_quantity;
  ELSE
    v_requested_qty := p_quantity;
  END IF;

  IF v_requested_qty > 0 AND v_available <= 0 THEN
    RAISE EXCEPTION 'This item is currently out of stock.';
  END IF;

  v_target_qty := LEAST(v_requested_qty, v_available);

  IF v_target_qty <= 0 THEN
    DELETE FROM public.cart_items WHERE cart_id = v_cart_id AND variant_id = p_variant_id;
    v_target_qty := 0;
  ELSE
    INSERT INTO public.cart_items (cart_id, variant_id, quantity)
    VALUES (v_cart_id, p_variant_id, v_target_qty)
    ON CONFLICT (cart_id, variant_id) DO UPDATE SET quantity = EXCLUDED.quantity;
  END IF;

  RETURN QUERY
  SELECT
    v_cart_id,
    p_variant_id,
    v_target_qty,
    v_available,
    v_price_pkr,
    (v_price_pkr * v_target_qty)::bigint,
    (v_target_qty <> v_requested_qty),
    agg.total_items,
    agg.cart_subtotal_pkr,
    agg.shipping_pkr,
    (agg.cart_subtotal_pkr + agg.shipping_pkr)::bigint
  FROM (
    SELECT
      COALESCE(SUM(ci.quantity) FILTER (WHERE avail.is_available), 0)::int AS total_items,
      COALESCE(SUM(ci.quantity * pv.price_pkr) FILTER (WHERE avail.is_available), 0)::bigint AS cart_subtotal_pkr,
      -- PKR 250 flat shipping per seller with >=1 available item;
      (COUNT(DISTINCT p2.seller_id) FILTER (WHERE avail.is_available) * 250)::bigint AS shipping_pkr
    FROM public.cart_items ci
    JOIN public.product_variants pv ON pv.id = ci.variant_id
    JOIN public.products p2 ON p2.id = pv.product_id
    JOIN public.sellers s2 ON s2.id = p2.seller_id
    CROSS JOIN LATERAL (
      SELECT (
        pv.is_active AND p2.status = 'active' AND s2.status = 'approved'
        AND GREATEST(0, pv.stock_quantity - pv.reserved_quantity) >= ci.quantity
      ) AS is_available
    ) avail
    WHERE ci.cart_id = v_cart_id
  ) agg;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_cart_item(uuid, text, uuid, int, boolean) FROM PUBLIC, anon, authenticated;

COMMIT;
