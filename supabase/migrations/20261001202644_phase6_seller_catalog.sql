-- Phase 6 Part 2: Seller Catalog
-- Merged from: 20261001202644_phase6_seller_catalog.sql and 20261001205852_phase6_seller_catalog_fixes.sql

-- ─── 1. get_seller_dashboard_stats (service_role only) ───────────────────────
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

  -- Balances (available vs held based on available_at)
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

REVOKE EXECUTE ON FUNCTION public.get_seller_dashboard_stats(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_dashboard_stats(UUID) TO service_role;

-- ─── 2. price_history: add compare_at_minor column ───────────────────────────
ALTER TABLE public.price_history ADD COLUMN IF NOT EXISTS compare_at_minor BIGINT;

-- ─── 3. private.record_price_history trigger function ────────────────────────
-- The initial schema defined record_price_history() in the public schema and
-- Phase 3 security already revoked EXECUTE from public/anon/authenticated on it.
-- We now replace it in the private schema (SECURITY DEFINER, SET search_path='')
-- and recreate the trigger so it captures both price_minor and compare_at_minor.

CREATE OR REPLACE FUNCTION private.record_price_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR NEW.price_minor IS DISTINCT FROM OLD.price_minor
     OR NEW.compare_at_minor IS DISTINCT FROM OLD.compare_at_minor
  THEN
    INSERT INTO public.price_history (variant_id, price_minor, compare_at_minor, recorded_at)
    VALUES (NEW.id, NEW.price_minor, NEW.compare_at_minor, clock_timestamp());
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.record_price_history() FROM PUBLIC, anon, authenticated;

-- Replace the old public.record_price_history trigger with the private version.
-- (DROP IF EXISTS handles both the original public-fn trigger and any interim trigger.)
DROP TRIGGER IF EXISTS tr_record_price_history ON public.product_variants;

CREATE TRIGGER tr_record_price_history
  AFTER INSERT OR UPDATE OF price_minor, compare_at_minor
  ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION private.record_price_history();

-- Ensure schema cache is refreshed
NOTIFY pgrst, 'reload schema';
