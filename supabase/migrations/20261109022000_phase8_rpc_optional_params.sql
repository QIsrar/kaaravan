-- Migration: 20261109022000_phase8_rpc_optional_params.sql
-- Add default values to create_order_transaction parameters to support
-- guest checkout and omitting optional fields cleanly.

DROP FUNCTION IF EXISTS public.create_order_transaction(UUID, TEXT, TEXT, JSONB, JSONB, public.payment_method, TEXT, TEXT, TEXT, BIGINT, JSONB, JSONB);

CREATE OR REPLACE FUNCTION public.create_order_transaction(
  p_profile_id UUID DEFAULT NULL,
  p_guest_email TEXT DEFAULT NULL,
  p_guest_phone TEXT DEFAULT NULL,
  p_shipping_address JSONB DEFAULT '{}'::jsonb,
  p_billing_address JSONB DEFAULT '{}'::jsonb,
  p_payment_method public.payment_method DEFAULT 'cod',
  p_idempotency_key TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT 'system',
  p_order_notes TEXT DEFAULT NULL,
  p_discount_minor BIGINT DEFAULT 0,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_seller_shipping JSONB DEFAULT '{}'::jsonb
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
  IF p_seller_shipping IS NOT NULL THEN
    FOR v_k IN SELECT jsonb_object_keys(p_seller_shipping)
    LOOP
      v_total_shipping_minor := v_total_shipping_minor + (p_seller_shipping->>v_k)::BIGINT;
    END LOOP;
  END IF;

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

  -- 8. Group items by seller and insert sub_orders + order_items
  FOR v_seller_id IN
    SELECT DISTINCT p.seller_id
    FROM jsonb_array_elements(p_items) item
    JOIN public.product_variants pv ON pv.id = (item->>'variantId')::UUID
    JOIN public.products p ON pv.product_id = p.id
  LOOP
    v_sub_order_id := pg_catalog.gen_random_uuid();
    v_seller_subtotal := 0;

    -- Subtotal for this seller
    SELECT COALESCE(SUM(pv.price_minor * (item->>'quantity')::INT), 0)
    INTO v_seller_subtotal
    FROM jsonb_array_elements(p_items) item
    JOIN public.product_variants pv ON pv.id = (item->>'variantId')::UUID
    JOIN public.products p ON pv.product_id = p.id
    WHERE p.seller_id = v_seller_id;

    -- Shipping for this seller
    v_seller_shipping := COALESCE((p_seller_shipping->>v_seller_id::text)::BIGINT, 0);
    v_seller_total := v_seller_subtotal + v_seller_shipping;

    -- Determine commission rate
    SELECT 
      COALESCE(
        s.commission_rate_bps,
        (
          SELECT c.commission_rate_bps 
          FROM public.products prod 
          JOIN public.categories c ON prod.category_id = c.id 
          WHERE prod.seller_id = v_seller_id AND c.commission_rate_bps IS NOT NULL 
          LIMIT 1
        ),
        500
      )
    INTO v_comm_rate_bps
    FROM public.sellers s
    WHERE s.id = v_seller_id;

    v_comm_minor := ROUND((v_seller_subtotal * v_comm_rate_bps)::NUMERIC / 10000.0)::BIGINT;

    -- Sub-order status: 'awaiting_confirmation' for COD, 'pending' for online
    IF p_payment_method = 'cod' THEN
      v_sub_order_status := 'awaiting_confirmation';
    ELSE
      v_sub_order_status := 'pending';
    END IF;

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

    -- Insert order_status_history
    INSERT INTO public.order_status_history (sub_order_id, status, note, created_by)
    VALUES (
      v_sub_order_id,
      v_sub_order_status,
      CASE WHEN p_payment_method = 'cod' 
           THEN 'Order placed with Cash on Delivery; awaiting confirmation.' 
           ELSE 'Order placed; payment pending.' 
      END,
      p_profile_id
    );

    -- Insert order_items snapshot for this seller
    INSERT INTO public.order_items (
      id,
      sub_order_id,
      variant_id,
      product_title,
      variant_title,
      sku,
      price_minor,
      quantity,
      subtotal_minor,
      metadata
    )
    SELECT
      pg_catalog.gen_random_uuid(),
      v_sub_order_id,
      pv.id,
      p.title,
      COALESCE(pv.attributes::text, ''),
      pv.sku,
      pv.price_minor,
      (item->>'quantity')::INT,
      pv.price_minor * (item->>'quantity')::INT,
      jsonb_build_object(
        'product_id', p.id,
        'category_id', p.category_id,
        'attributes', pv.attributes
      )
    FROM jsonb_array_elements(p_items) item
    JOIN public.product_variants pv ON pv.id = (item->>'variantId')::UUID
    JOIN public.products p ON pv.product_id = p.id
    WHERE p.seller_id = v_seller_id;

    -- Insert pending commission row
    INSERT INTO public.commissions (
      sub_order_id,
      rate_bps,
      amount_minor,
      status
    ) VALUES (
      v_sub_order_id,
      v_comm_rate_bps,
      v_comm_minor,
      'pending'
    );

    v_sub_orders_result := v_sub_orders_result || jsonb_build_object(
      'sub_order_id', v_sub_order_id,
      'seller_id', v_seller_id,
      'commission_minor', v_comm_minor,
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
