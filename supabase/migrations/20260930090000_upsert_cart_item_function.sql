-- Phase 4 speed fix: add-to-cart and quantity changes were taking ~1-2s+ per
-- call (measured against the linked project) because the TS service layer
-- did 5-6 sequential round trips per mutation (resolve/create cart, check
-- variant+product+seller, check existing line, upsert, then a full nested
-- re-read of the whole cart just to return totals). This function collapses
-- all of that into ONE round trip: resolve-or-create the cart, validate and
-- lock the variant, upsert or delete the line, and return just the changed
-- line plus cart totals (not the full nested cart with images/seller names).
--
-- Only ever called via the server-only admin/service-role Supabase client
-- from lib/services/cart.ts (same trust boundary as every other cart
-- mutation today: identity is resolved and validated by getCartIdentifier()
-- in Next.js before this is called). Not exposed to anon/authenticated via
-- PostgREST, so it does not need to re-derive or check auth.uid() itself.

CREATE UNIQUE INDEX IF NOT EXISTS carts_one_per_profile ON public.carts(profile_id) WHERE profile_id IS NOT NULL;

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
  out_price_minor bigint,
  out_subtotal_minor bigint,
  out_adjusted boolean,
  out_total_items int,
  out_cart_subtotal_minor bigint,
  out_shipping_minor bigint,
  out_grand_total_minor bigint
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
  v_price_minor bigint;
  v_current_qty int;
  v_requested_qty int;
  v_target_qty int;
  v_available int;
BEGIN
  IF p_quantity < 0 OR p_quantity > 99 THEN
    RAISE EXCEPTION 'Quantity must be between 0 and 99.';
  END IF;

  IF p_profile_id IS NULL AND p_guest_token IS NULL THEN
    RAISE EXCEPTION 'Either profile id or guest token is required';
  END IF;

  -- Resolve or create the cart (profile_id has no unique constraint, so this
  -- mirrors the existing service-layer select-then-insert; guest_token is
  -- UNIQUE so a concurrent insert is handled via ON CONFLICT DO NOTHING).
  IF p_profile_id IS NOT NULL THEN
    SELECT c.id INTO v_cart_id FROM public.carts c WHERE c.profile_id = p_profile_id;
    IF v_cart_id IS NULL THEN
      INSERT INTO public.carts (profile_id, currency)
        VALUES (p_profile_id, 'PKR')
        ON CONFLICT (profile_id) WHERE profile_id IS NOT NULL DO NOTHING
        RETURNING id INTO v_cart_id;
      IF v_cart_id IS NULL THEN
        SELECT c.id INTO v_cart_id FROM public.carts c WHERE c.profile_id = p_profile_id;
      END IF;
    END IF;
  ELSE
    SELECT c.id INTO v_cart_id FROM public.carts c WHERE c.guest_token = p_guest_token;
    IF v_cart_id IS NULL THEN
      INSERT INTO public.carts (guest_token, currency)
        VALUES (p_guest_token, 'PKR')
        ON CONFLICT (guest_token) DO NOTHING
        RETURNING id INTO v_cart_id;
      IF v_cart_id IS NULL THEN
        SELECT c.id INTO v_cart_id FROM public.carts c WHERE c.guest_token = p_guest_token;
      END IF;
    END IF;
  END IF;

  -- Lock and validate the variant/product/seller in one query.
  SELECT v.stock_quantity, v.reserved_quantity, v.is_active, v.price_minor, p.status, s.status
    INTO v_stock, v_reserved, v_is_active, v_price_minor, v_product_status, v_seller_status
  FROM public.product_variants v
  JOIN public.products p ON p.id = v.product_id
  JOIN public.sellers s ON s.id = p.seller_id
  WHERE v.id = p_variant_id;

  IF NOT FOUND OR NOT v_is_active OR v_product_status <> 'active' OR v_seller_status <> 'approved' THEN
    RAISE EXCEPTION 'This item is currently unavailable.';
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
    v_price_minor,
    (v_price_minor * v_target_qty)::bigint,
    (v_target_qty <> v_requested_qty),
    agg.total_items,
    agg.cart_subtotal_minor,
    agg.shipping_minor,
    (agg.cart_subtotal_minor + agg.shipping_minor)::bigint
  FROM (
    SELECT
      COALESCE(SUM(ci.quantity) FILTER (WHERE avail.is_available), 0)::int AS total_items,
      COALESCE(SUM(ci.quantity * pv.price_minor) FILTER (WHERE avail.is_available), 0)::bigint AS cart_subtotal_minor,
      -- PKR 250 (25000 paisa) flat shipping per seller with >=1 available item;
      -- must match DEFAULT_SHIPPING_PER_SELLER_MINOR in lib/services/cart.ts.
      (COUNT(DISTINCT p2.seller_id) FILTER (WHERE avail.is_available) * 25000)::bigint AS shipping_minor
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
