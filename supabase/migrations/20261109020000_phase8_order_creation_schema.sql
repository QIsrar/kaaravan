-- ======================================================================
-- Phase 8 Migration: Order Creation, Money Column Locks, Non-Sequential
-- Order Numbers, and Single-Transaction Order Creation
-- ======================================================================

-- 1. Add idempotency_key to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key 
  ON public.orders(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- 2. Non-sequential random order number generator: KV-XXXXXX
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = ''
AS $$
DECLARE
  v_chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- 32 unambiguous chars
  v_result TEXT;
  v_exists BOOLEAN;
  v_i INT;
  v_random INT;
BEGIN
  LOOP
    v_result := 'KV-';
    FOR v_i IN 1..6 LOOP
      v_random := floor(random() * 32 + 1)::INT;
      v_result := v_result || substr(v_chars, v_random, 1);
    END LOOP;
    
    SELECT EXISTS (
      SELECT 1 FROM public.orders WHERE order_number = v_result
    ) INTO v_exists;
    
    IF NOT v_exists THEN
      RETURN v_result;
    END IF;
  END LOOP;
END;
$$;

-- 3. Lock financial columns on orders (subtotal, shipping, discount, total, currency)
CREATE OR REPLACE FUNCTION private.lock_orders_money_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (OLD.subtotal_minor IS DISTINCT FROM NEW.subtotal_minor) OR
     (OLD.shipping_minor IS DISTINCT FROM NEW.shipping_minor) OR
     (OLD.discount_minor IS DISTINCT FROM NEW.discount_minor) OR
     (OLD.total_minor IS DISTINCT FROM NEW.total_minor) OR
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

-- 4. Lock financial columns on sub_orders (subtotal, shipping, total)
CREATE OR REPLACE FUNCTION private.lock_sub_orders_money_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (OLD.subtotal_minor IS DISTINCT FROM NEW.subtotal_minor) OR
     (OLD.shipping_minor IS DISTINCT FROM NEW.shipping_minor) OR
     (OLD.total_minor IS DISTINCT FROM NEW.total_minor) THEN
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

-- 5. Lock payments amount and log status changes
CREATE OR REPLACE FUNCTION private.lock_payments_amount_and_log_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (OLD.amount_minor IS DISTINCT FROM NEW.amount_minor) OR
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

-- 6. Lock payouts amount and log status changes
CREATE OR REPLACE FUNCTION private.lock_payouts_amount_and_log_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (OLD.amount_minor IS DISTINCT FROM NEW.amount_minor) OR
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

-- 7. Function to release stock and cancel order (used by cancellation & auto-expire)
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
  v_item RECORD;
  v_order RECORD;
BEGIN
  SELECT id, payment_status INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Release reserved quantities for all items in the order
  FOR v_item IN
    SELECT oi.variant_id, oi.quantity
    FROM public.order_items oi
    JOIN public.sub_orders so ON oi.sub_order_id = so.id
    WHERE so.order_id = p_order_id AND oi.variant_id IS NOT NULL
  LOOP
    UPDATE public.product_variants
    SET reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity),
        updated_at = pg_catalog.now()
    WHERE id = v_item.variant_id;
  END LOOP;

  -- Cancel all sub_orders
  UPDATE public.sub_orders
  SET status = 'cancelled',
      updated_at = pg_catalog.now()
  WHERE order_id = p_order_id;

  -- Append audit log
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, before, after, ip)
  VALUES (
    p_actor_id,
    'ORDER_STOCK_RELEASED',
    'orders',
    p_order_id,
    jsonb_build_object('payment_status', v_order.payment_status),
    jsonb_build_object('payment_status', 'cancelled', 'reason', p_reason),
    'system'
  );

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

-- 8. Single-transaction create_order_transaction RPC
CREATE OR REPLACE FUNCTION public.create_order_transaction(
  p_profile_id UUID,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_shipping_address JSONB,
  p_billing_address JSONB,
  p_payment_method public.payment_method,
  p_idempotency_key TEXT,
  p_ip_address TEXT,
  p_order_notes TEXT,
  p_discount_minor BIGINT,
  p_items JSONB,
  p_seller_shipping JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing RECORD;
  v_order_id UUID := pg_catalog.gen_random_uuid();
  v_order_number TEXT;
  v_item JSONB;
  v_variant RECORD;
  v_subtotal_minor BIGINT := 0;
  v_total_shipping_minor BIGINT := 0;
  v_total_minor BIGINT := 0;
  v_seller_id UUID;
  v_seller_subtotal BIGINT;
  v_seller_shipping BIGINT;
  v_seller_total BIGINT;
  v_sub_order_id UUID;
  v_sub_order_status public.sub_order_status;
  v_comm_rate_bps INT;
  v_comm_minor BIGINT;
  v_sub_orders_result JSONB := '[]'::jsonb;
  v_seller_keys TEXT[];
  v_k TEXT;
BEGIN
  -- 1. Idempotency Check
  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT id, order_number, payment_status, total_minor INTO v_existing
    FROM public.orders
    WHERE idempotency_key = trim(p_idempotency_key);

    IF v_existing.id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'is_idempotent', true,
        'order_id', v_existing.id,
        'order_number', v_existing.order_number,
        'payment_status', v_existing.payment_status,
        'total_minor', v_existing.total_minor
      );
    END IF;
  END IF;

  -- 2. Validate input has items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'EMPTY_CART', 'message', 'Cart is empty');
  END IF;

  -- 3. Verify each item: Lock rows, check active status, prices, and stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT 
      pv.id AS variant_id,
      pv.price_minor,
      pv.stock_quantity,
      pv.reserved_quantity,
      pv.is_active AS variant_active,
      pv.attributes AS variant_attributes,
      p.id AS product_id,
      p.title AS product_title,
      p.status AS product_status,
      p.category_id,
      s.id AS seller_id,
      s.status AS seller_status,
      s.business_name AS seller_name,
      s.commission_rate_bps AS seller_commission_bps,
      c.commission_rate_bps AS category_commission_bps
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON pv.product_id = p.id
    JOIN public.sellers s ON p.seller_id = s.id
    LEFT JOIN public.categories c ON p.category_id = c.id
    WHERE pv.id = (v_item->>'variantId')::UUID
      AND pv.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND s.deleted_at IS NULL
    FOR UPDATE OF pv;

    IF v_variant.variant_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'ITEM_NOT_FOUND',
        'message', 'One or more items in your cart are no longer available.'
      );
    END IF;

    IF v_variant.seller_status != 'approved' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'SELLER_UNAVAILABLE',
        'message', format('Merchant "%s" is currently not accepting orders.', v_variant.seller_name)
      );
    END IF;

    IF v_variant.product_status != 'active' OR v_variant.variant_active = FALSE THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'PRODUCT_INACTIVE',
        'message', format('Product "%s" is currently unavailable.', v_variant.product_title)
      );
    END IF;

    -- Check price
    IF v_variant.price_minor != (v_item->>'expectedPriceMinor')::BIGINT THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'PRICE_DIFF',
        'message', format('Price for "%s" has changed. Please review your cart.', v_variant.product_title),
        'diff', jsonb_build_object(
          'variant_id', v_variant.variant_id,
          'expected_price_minor', (v_item->>'expectedPriceMinor')::BIGINT,
          'actual_price_minor', v_variant.price_minor
        )
      );
    END IF;

    -- Check stock
    IF (v_variant.stock_quantity - v_variant.reserved_quantity) < (v_item->>'quantity')::INT THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'INSUFFICIENT_STOCK',
        'message', format('Insufficient stock for "%s". Only %s available.', v_variant.product_title, (v_variant.stock_quantity - v_variant.reserved_quantity)),
        'diff', jsonb_build_object(
          'variant_id', v_variant.variant_id,
          'available_stock', (v_variant.stock_quantity - v_variant.reserved_quantity),
          'requested_quantity', (v_item->>'quantity')::INT
        )
      );
    END IF;

    -- Accumulate subtotal
    v_subtotal_minor := v_subtotal_minor + (v_variant.price_minor * (v_item->>'quantity')::INT);
  END LOOP;

  -- 4. Calculate total shipping across unique sellers
  FOR v_k IN SELECT jsonb_object_keys(p_seller_shipping)
  LOOP
    v_total_shipping_minor := v_total_shipping_minor + (p_seller_shipping->>v_k)::BIGINT;
  END LOOP;

  v_total_minor := GREATEST(0, v_subtotal_minor + v_total_shipping_minor - COALESCE(p_discount_minor, 0));

  -- 5. Reserve stock for all items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE public.product_variants
    SET reserved_quantity = reserved_quantity + (v_item->>'quantity')::INT,
        updated_at = pg_catalog.now()
    WHERE id = (v_item->>'variantId')::UUID;
  END LOOP;

  -- 6. Generate non-sequential order number
  v_order_number := public.generate_order_number();

  -- 7. Insert orders row
  INSERT INTO public.orders (
    id,
    order_number,
    profile_id,
    guest_email,
    guest_phone,
    subtotal_minor,
    shipping_minor,
    discount_minor,
    total_minor,
    currency,
    payment_method,
    payment_status,
    shipping_address,
    billing_address,
    idempotency_key,
    placed_at
  ) VALUES (
    v_order_id,
    v_order_number,
    p_profile_id,
    p_guest_email,
    p_guest_phone,
    v_subtotal_minor,
    v_total_shipping_minor,
    COALESCE(p_discount_minor, 0),
    v_total_minor,
    'PKR',
    p_payment_method,
    'pending',
    p_shipping_address,
    p_billing_address,
    trim(p_idempotency_key),
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
    v_seller_shipping := (p_seller_shipping->>v_k)::BIGINT;
    v_seller_subtotal := 0;

    -- Calculate seller subtotal
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      SELECT p.seller_id, pv.price_minor INTO v_variant
      FROM public.product_variants pv
      JOIN public.products p ON pv.product_id = p.id
      WHERE pv.id = (v_item->>'variantId')::UUID;

      IF v_variant.seller_id = v_seller_id THEN
        v_seller_subtotal := v_seller_subtotal + (v_variant.price_minor * (v_item->>'quantity')::INT);
      END IF;
    END LOOP;

    v_seller_total := v_seller_subtotal + v_seller_shipping;
    v_sub_order_id := pg_catalog.gen_random_uuid();

    -- Insert sub_order
    INSERT INTO public.sub_orders (
      id,
      order_id,
      seller_id,
      status,
      subtotal_minor,
      shipping_minor,
      total_minor
    ) VALUES (
      v_sub_order_id,
      v_order_id,
      v_seller_id,
      v_sub_order_status,
      v_seller_subtotal,
      v_seller_shipping,
      v_seller_total
    );

    -- Insert order_items for this seller
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      SELECT 
        pv.id AS variant_id,
        pv.price_minor,
        pv.attributes AS variant_attributes,
        p.title AS product_title,
        p.seller_id,
        p.category_id,
        s.commission_rate_bps AS seller_commission_bps,
        c.commission_rate_bps AS category_commission_bps
      INTO v_variant
      FROM public.product_variants pv
      JOIN public.products p ON pv.product_id = p.id
      JOIN public.sellers s ON p.seller_id = s.id
      LEFT JOIN public.categories c ON p.category_id = c.id
      WHERE pv.id = (v_item->>'variantId')::UUID;

      IF v_variant.seller_id = v_seller_id THEN
        INSERT INTO public.order_items (
          sub_order_id,
          variant_id,
          product_title,
          variant_attributes,
          unit_price_minor,
          quantity,
          line_total_minor
        ) VALUES (
          v_sub_order_id,
          v_variant.variant_id,
          v_variant.product_title,
          v_variant.variant_attributes,
          v_variant.price_minor,
          (v_item->>'quantity')::INT,
          v_variant.price_minor * (v_item->>'quantity')::INT
        );

        -- Pick commission rate for seller
        v_comm_rate_bps := COALESCE(v_variant.seller_commission_bps, v_variant.category_commission_bps, 500);
      END IF;
    END LOOP;

    -- Calculate commission (default 500 bps = 5.0% if neither seller nor category has override)
    v_comm_rate_bps := COALESCE(v_comm_rate_bps, 500);
    v_comm_minor := ROUND((v_seller_subtotal * v_comm_rate_bps) / 10000.0)::BIGINT;

    INSERT INTO public.commissions (
      sub_order_id,
      rate_bps,
      base_minor,
      commission_minor
    ) VALUES (
      v_sub_order_id,
      v_comm_rate_bps,
      v_seller_subtotal,
      v_comm_minor
    );

    v_sub_orders_result := v_sub_orders_result || jsonb_build_object(
      'sub_order_id', v_sub_order_id,
      'seller_id', v_seller_id,
      'subtotal_minor', v_seller_subtotal,
      'shipping_minor', v_seller_shipping,
      'total_minor', v_seller_total,
      'status', v_sub_order_status
    );
  END LOOP;

  -- 9. For COD: insert cod_confirmations row
  IF p_payment_method = 'cod' THEN
    INSERT INTO public.cod_confirmations (order_id, channel, status)
    VALUES (v_order_id, 'sms_whatsapp', 'pending');
  END IF;

  -- 10. For Online: insert initial payments row
  IF p_payment_method != 'cod' THEN
    INSERT INTO public.payments (
      order_id,
      gateway,
      method,
      amount_minor,
      status,
      idempotency_key
    ) VALUES (
      v_order_id,
      'mock',
      p_payment_method,
      v_total_minor,
      'pending',
      trim(p_idempotency_key)
    );
  END IF;

  -- 11. Append audit log
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, before, after, ip)
  VALUES (
    p_profile_id,
    'ORDER_CREATED',
    'orders',
    v_order_id,
    jsonb_build_object('action', 'ORDER_INITIATED'),
    jsonb_build_object(
      'order_number', v_order_number,
      'payment_method', p_payment_method,
      'total_minor', v_total_minor,
      'sub_orders_count', jsonb_array_length(v_sub_orders_result)
    ),
    p_ip_address
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal_minor', v_subtotal_minor,
    'shipping_minor', v_total_shipping_minor,
    'discount_minor', COALESCE(p_discount_minor, 0),
    'total_minor', v_total_minor,
    'payment_method', p_payment_method,
    'payment_status', 'pending',
    'sub_orders', v_sub_orders_result
  );
END;
$$;

-- Restrict execution to service_role
REVOKE ALL ON FUNCTION public.create_order_transaction FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_transaction TO service_role;

REVOKE ALL ON FUNCTION public.release_order_stock FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_order_stock TO service_role;

GRANT USAGE ON SCHEMA private TO service_role;

