BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- ===== New migration: 20260929120000_search_products_function.sql =====
CREATE OR REPLACE FUNCTION public.search_products(q text, lim int DEFAULT 24, off int DEFAULT 0)
RETURNS TABLE (product_id uuid, rank real)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT
    p.id AS product_id,
    GREATEST(
      ts_rank(p.search_vector, websearch_to_tsquery('simple', q)),
      word_similarity(q, p.title)
    ) AS rank
  FROM public.products p
  JOIN public.sellers s ON s.id = p.seller_id
  WHERE q IS NOT NULL
    AND length(trim(q)) > 0
    AND p.status = 'active'
    AND p.deleted_at IS NULL
    AND s.status = 'approved'
    AND s.deleted_at IS NULL
    AND (
      p.search_vector @@ websearch_to_tsquery('simple', q)
      OR q <% p.title
    )
  ORDER BY rank DESC, p.rating_avg DESC NULLS LAST
  LIMIT LEAST(GREATEST(lim, 1), 100)
  OFFSET GREATEST(off, 0);
$$;

REVOKE EXECUTE ON FUNCTION public.search_products(text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_products(text, int, int) TO anon, authenticated;
-- ===== end new migration =====

CREATE TEMP TABLE test_results (result text);
GRANT ALL ON TABLE test_results TO anon, authenticated, postgres;

SELECT plan(18);

-- ===== supabase/tests/rls_test.sql (plan/finish removed, each assertion captured) =====

CREATE OR REPLACE FUNCTION tests_set_auth(user_id uuid, role text DEFAULT 'authenticated') RETURNS void AS $$
BEGIN
  EXECUTE format('set local role %I', role);
  PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "role": "%s"}', user_id, role), true);
END;
$$ LANGUAGE plpgsql;

RESET ROLE;
SET local role postgres;

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'seller_a@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'seller_b@test.com'),
  ('33333333-3333-3333-3333-333333333333', 'customer_a@test.com'),
  ('44444444-4444-4444-4444-444444444444', 'customer_b@test.com');

UPDATE public.profiles SET role = 'seller' WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

INSERT INTO public.sellers (id, owner_profile_id, business_name, slug, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Seller A', 'seller-a', 'approved'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Seller B', 'seller-b', 'approved');

INSERT INTO public.categories (id, name, slug) VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Test Category', 'test-category');

INSERT INTO public.products (id, seller_id, category_id, title, slug, status) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Draft Product', 'draft-prod', 'draft'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Active Product', 'active-prod', 'active'),
  ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Other Product', 'other-prod', 'active');

INSERT INTO public.orders (id, order_number, profile_id, shipping_address, billing_address, payment_method, subtotal_minor, shipping_minor, total_minor) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'ORD-1', '33333333-3333-3333-3333-333333333333', '{}', '{}', 'cod', 100, 0, 100),
  ('10000000-0000-0000-0000-000000000000', 'ORD-2', '44444444-4444-4444-4444-444444444444', '{}', '{}', 'cod', 100, 0, 100);

INSERT INTO public.sub_orders (id, order_id, seller_id, status, subtotal_minor, shipping_minor, total_minor) VALUES
  ('20000000-0000-0000-0000-000000000000', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'delivered', 100, 0, 100),
  ('30000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'pending', 100, 0, 100);

INSERT INTO public.product_variants (id, product_id, sku, price_minor) VALUES
  ('50000000-0000-0000-0000-000000000000', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'SKU-1', 100);

INSERT INTO public.order_items (id, sub_order_id, variant_id, product_title, variant_attributes, unit_price_minor, quantity, line_total_minor) VALUES
  ('40000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000000', 'Title', '{}', 100, 1, 100);

INSERT INTO public.seller_kyc (seller_id, cnic_number) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '12345');


-- 1. Seller A cannot read seller B's sub_orders
RESET ROLE;
SELECT tests_set_auth('11111111-1111-1111-1111-111111111111', 'authenticated');
INSERT INTO test_results SELECT is(
  (SELECT count(*) FROM public.sub_orders),
  1::bigint,
  'Seller A should only see 1 sub_order (their own)'
);

-- 2. Customer cannot read another customer's order
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
INSERT INTO test_results SELECT is(
  (SELECT count(*) FROM public.orders),
  1::bigint,
  'Customer A should only see their own order'
);

-- 3. Anon cannot read draft products
RESET ROLE;
SELECT tests_set_auth('00000000-0000-0000-0000-000000000000', 'anon');
INSERT INTO test_results SELECT is(
  (SELECT count(*) FROM public.products WHERE status = 'draft'),
  0::bigint,
  'Anon cannot read draft products'
);

-- 4. Anon cannot read seller_kyc
RESET ROLE;
SELECT tests_set_auth('00000000-0000-0000-0000-000000000000', 'anon');
INSERT INTO test_results SELECT is(
  (SELECT count(*) FROM public.seller_kyc),
  0::bigint,
  'Anon cannot read seller_kyc'
);

-- 5. Nobody can update seller_ledger from the client
RESET ROLE;
SET local role postgres;
INSERT INTO public.seller_ledger (id, seller_id, entry_type, amount_minor, balance_after_minor, available_at) VALUES
  ('60000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sale', 100, 100, pg_catalog.now());

RESET ROLE;
SELECT tests_set_auth('11111111-1111-1111-1111-111111111111', 'authenticated');
UPDATE public.seller_ledger SET amount_minor = 999 WHERE id = '60000000-0000-0000-0000-000000000000';
RESET ROLE;
SET local role postgres;
INSERT INTO test_results SELECT is(
  (SELECT amount_minor FROM public.seller_ledger WHERE id = '60000000-0000-0000-0000-000000000000'),
  100::bigint,
  'Client cannot update seller_ledger (update should not change the row due to missing UPDATE policy)'
);

-- 6. User cannot change own role
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
UPDATE public.profiles SET role = 'superadmin' WHERE id = '33333333-3333-3333-3333-333333333333';
INSERT INTO test_results SELECT is(
  (SELECT role::text FROM public.profiles WHERE id = '33333333-3333-3333-3333-333333333333'),
  'customer',
  'User cannot change their own role'
);

-- 7. Client cannot insert an approved seller
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
INSERT INTO public.sellers (owner_profile_id, business_name, slug, status) VALUES ('33333333-3333-3333-3333-333333333333', 'Test', 'test', 'approved');
INSERT INTO test_results SELECT is(
  (SELECT status::text FROM public.sellers WHERE slug = 'test'),
  'pending',
  'Client inserted seller must default to pending'
);

-- 8. Seller cannot set a product active (only draft/pending_review/archived)
RESET ROLE;
SELECT tests_set_auth('11111111-1111-1111-1111-111111111111', 'authenticated');
INSERT INTO public.products (seller_id, category_id, title, slug, status) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Test Prod', 'test-slug', 'active');
INSERT INTO test_results SELECT is(
  (SELECT status::text FROM public.products WHERE slug = 'test-slug'),
  'draft',
  'Client inserted product must default to draft if tried to set active'
);

-- 9. Customer cannot set a return to refunded
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
INSERT INTO test_results SELECT throws_ok(
  $$ INSERT INTO public.returns (order_item_id, sub_order_id, reason, refund_minor, status) VALUES ('40000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000000', 'Reason', 100, 'requested') $$,
  '42501',
  NULL,
  'Customer cannot insert returns via client (SELECT-only policy)'
);

-- 10. Buyer cannot accept own offer
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
INSERT INTO test_results SELECT throws_ok(
  $$ INSERT INTO public.offers (variant_id, buyer_id, seller_id, offered_minor, status, expires_at) VALUES ('50000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50, 'accepted', pg_catalog.now()) $$,
  '42501',
  NULL,
  'Customer cannot insert offers via client (SELECT-only policy)'
);

-- 11. User cannot insert a second seller row
RESET ROLE;
SELECT tests_set_auth('11111111-1111-1111-1111-111111111111', 'authenticated');
INSERT INTO test_results SELECT throws_ok(
  $$ INSERT INTO public.sellers (owner_profile_id, business_name, slug, status) VALUES ('11111111-1111-1111-1111-111111111111', 'Seller A 2', 'seller-a-2', 'pending') $$,
  '23505',
  NULL,
  'User cannot insert a second seller row (unique index constraint)'
);

-- 12. Test dispute insert requirements
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
INSERT INTO test_results SELECT throws_ok(
  $$ INSERT INTO public.disputes (sub_order_id, opened_by) VALUES ('30000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333') $$,
  '42501',
  NULL,
  'Customer cannot open dispute for sub_order belonging to another customer'
);

-- 13. Test reviews insert requirements for correct product_id mapping
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
-- Sub_order is delivered, order_item is valid and customer's own.
-- Trying to review product Y ('999...999') using order_item ('400...000') that maps to product X ('eee...eee').
INSERT INTO test_results SELECT throws_ok(
  $$ INSERT INTO public.reviews (profile_id, product_id, order_item_id, title, body, rating) VALUES ('33333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999', '40000000-0000-0000-0000-000000000000', 'Test', 'Body', 5) $$,
  '42501',
  NULL,
  'Customer cannot review a product mismatching the order item''s actual product'
);


-- 14. anon cannot execute private.is_superadmin()
RESET ROLE;
SELECT tests_set_auth('00000000-0000-0000-0000-000000000000', 'anon');
INSERT INTO test_results SELECT throws_ok(
  $$ SELECT private.is_superadmin() $$,
  '42501',
  NULL,
  'Anon cannot execute private.is_superadmin()'
);

-- 15. User cannot change own role to seller or admin_staff
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
UPDATE public.profiles SET role = 'seller' WHERE id = '33333333-3333-3333-3333-333333333333';
INSERT INTO test_results SELECT is(
  (SELECT role::text FROM public.profiles WHERE id = '33333333-3333-3333-3333-333333333333'),
  'customer',
  'User cannot change their own role to seller'
);

UPDATE public.profiles SET role = 'admin_staff' WHERE id = '33333333-3333-3333-3333-333333333333';
INSERT INTO test_results SELECT is(
  (SELECT role::text FROM public.profiles WHERE id = '33333333-3333-3333-3333-333333333333'),
  'customer',
  'User cannot change their own role to admin_staff'
);

-- 16. search_products only returns active products (never draft, even on a title match)
RESET ROLE;
SELECT tests_set_auth('00000000-0000-0000-0000-000000000000', 'anon');
INSERT INTO test_results SELECT is(
  (SELECT count(*) FROM public.search_products('Draft', 10, 0)),
  0::bigint,
  'search_products never returns draft products'
);

-- 17. search_products returns matching active products of approved sellers
-- (membership, not exact-set: the live catalog may contain other real rows
-- that also legitimately match the word "Active" in their description)
INSERT INTO test_results SELECT is(
  (SELECT bool_or(product_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee') FROM public.search_products('Active', 10, 0)),
  true,
  'search_products returns the matching active product'
);

-- ===== extra manual checks (not in rls_test.sql): typo tolerance against real seed titles =====
RESET ROLE;
SET local role postgres;
INSERT INTO test_results
  SELECT CASE WHEN count(*) > 0 THEN 'ok - typo "chapal" matches a real Chappal product' ELSE 'not ok - typo "chapal" matched nothing' END
  FROM public.search_products('chapal', 10, 0);

INSERT INTO test_results
  SELECT CASE WHEN count(*) = 0 THEN 'ok - gibberish query returns no rows' ELSE 'not ok - gibberish query unexpectedly matched' END
  FROM public.search_products('zzqxnonsense', 10, 0);

RESET ROLE;
SELECT * FROM test_results;
ROLLBACK;
