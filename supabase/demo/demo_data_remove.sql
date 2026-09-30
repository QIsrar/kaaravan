-- =============================================================================
-- Kaaravan Marketplace — Archive Phase 4 Demo Data (Safe Teardown)
-- =============================================================================
-- Keep in sync with demo_data.sql. Any demo data added in later phases (e.g. Phase 5 demo orders, demo customer) must be archived here too.
-- Note: price_history is append-only with FKs to variants. Hard deletes will fail.
-- This script soft-deletes and archives all demo records cleanly by fixed ID patterns.
-- =============================================================================

BEGIN;

-- 1. Archive Demo Products
UPDATE public.products
SET
  status = 'archived',
  deleted_at = NOW()
WHERE id::text LIKE 'c1000000-0000-0000-0000-%';

-- 2. Deactivate Demo Product Variants
UPDATE public.product_variants
SET
  is_active = FALSE
WHERE id::text LIKE 'f1000000-0000-____-0000-%'
  AND SUBSTRING(id::text, 15, 1) = '0';

-- 3. Suspend & Soft-Delete Demo Sellers
UPDATE public.sellers
SET
  status = 'suspended',
  deleted_at = NOW()
WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

-- 4. Deactivate Demo Home Banners
UPDATE public.banners
SET
  is_active = FALSE
WHERE id::text LIKE 'e1000000-0000-0000-0000-%';

-- 5. Soft-Delete Demo Categories (2 levels)
UPDATE public.categories
SET
  is_active = FALSE,
  deleted_at = NOW()
WHERE id::text LIKE 'b1000000-0000-0000-0000-%'
   OR id::text LIKE 'b2000000-0000-0000-0000-%';

-- 6. Soft-Delete Demo Brands
UPDATE public.brands
SET
  deleted_at = NOW()
WHERE id::text LIKE 'd1000000-0000-0000-0000-%';

-- 7. Reset Demo User Profiles
UPDATE public.profiles
SET
  status = 'suspended'
WHERE id IN (
  '10def90d-80e6-49d0-8ee4-b49c2a476367',
  'caf061d7-2d72-4edd-8a8e-a0817f297fe7',
  '39d5d603-a839-443c-8547-5c2139a49c5b',
  'cc7ff7ac-a8ee-43ca-85cb-2750bf0beb81'
);

-- 8. Block Login for Demo Accounts in auth.users
UPDATE auth.users
SET banned_until = 'infinity'
WHERE id IN (
  '10def90d-80e6-49d0-8ee4-b49c2a476367',
  'caf061d7-2d72-4edd-8a8e-a0817f297fe7',
  '39d5d603-a839-443c-8547-5c2139a49c5b',
  'cc7ff7ac-a8ee-43ca-85cb-2750bf0beb81'
);
-- 9. Archive Demo Orders
UPDATE public.orders
SET deleted_at = NOW()
WHERE id::text LIKE '71000000-0000-0000-0000-%';

UPDATE public.sub_orders
SET deleted_at = NOW()
WHERE id::text LIKE '72000000-0000-0000-0000-%';
COMMIT;

-- 10. Confirmation Summary
SELECT
  (SELECT COUNT(*) FROM public.products WHERE id::text LIKE 'c1000000-0000-0000-0000-%' AND status = 'archived') AS archived_products,
  (SELECT COUNT(*) FROM public.product_variants WHERE id::text LIKE 'f1000000-0000-____-0000-%' AND SUBSTRING(id::text, 15, 1) = '0' AND is_active = FALSE) AS deactivated_variants,
  (SELECT COUNT(*) FROM public.sellers WHERE id IN ('a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333') AND status = 'suspended') AS suspended_sellers,
  (SELECT COUNT(*) FROM public.categories WHERE (id::text LIKE 'b1000000-0000-0000-0000-%' OR id::text LIKE 'b2000000-0000-0000-0000-%') AND deleted_at IS NOT NULL) AS deleted_categories,
  (SELECT COUNT(*) FROM public.brands WHERE id::text LIKE 'd1000000-0000-0000-0000-%' AND deleted_at IS NOT NULL) AS deleted_brands,
  (SELECT COUNT(*) FROM public.banners WHERE id::text LIKE 'e1000000-0000-0000-0000-%' AND is_active = FALSE) AS deactivated_banners,
  (SELECT COUNT(*) FROM auth.users WHERE id IN ('10def90d-80e6-49d0-8ee4-b49c2a476367', 'caf061d7-2d72-4edd-8a8e-a0817f297fe7', '39d5d603-a839-443c-8547-5c2139a49c5b', 'cc7ff7ac-a8ee-43ca-85cb-2750bf0beb81') AND banned_until = 'infinity') AS banned_users,
  (SELECT COUNT(*) FROM public.orders WHERE id::text LIKE '71000000-0000-0000-0000-%' AND deleted_at IS NOT NULL) AS archived_orders;
