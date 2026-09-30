BEGIN;
SELECT plan(33);

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

-- Fixtures for upsert_cart_item(): an active, in-stock variant and a variant
-- on a draft (never purchasable) product.
INSERT INTO public.product_variants (id, product_id, sku, price_minor, stock_quantity, reserved_quantity, is_active) VALUES
  ('50000000-0000-0000-0000-000000000099', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'SKU-CART-TEST', 500, 10, 2, true);
INSERT INTO public.product_variants (id, product_id, sku, price_minor, stock_quantity, is_active) VALUES
  ('50000000-0000-0000-0000-000000000098', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'SKU-DRAFT-TEST', 300, 10, true);

INSERT INTO public.order_items (id, sub_order_id, variant_id, product_title, variant_attributes, unit_price_minor, quantity, line_total_minor) VALUES
  ('40000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000000', 'Title', '{}', 100, 1, 100);

INSERT INTO public.seller_kyc (seller_id, cnic_number) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '12345');


-- 1. Seller A cannot read seller B's sub_orders
RESET ROLE;
SELECT tests_set_auth('11111111-1111-1111-1111-111111111111', 'authenticated');
SELECT is(
  (SELECT count(*) FROM public.sub_orders),
  1::bigint,
  'Seller A should only see 1 sub_order (their own)'
);

-- 2. Customer cannot read another customer's order
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
SELECT is(
  (SELECT count(*) FROM public.orders),
  1::bigint,
  'Customer A should only see their own order'
);

-- 3. Anon cannot read draft products
RESET ROLE;
SELECT tests_set_auth('00000000-0000-0000-0000-000000000000', 'anon');
SELECT is(
  (SELECT count(*) FROM public.products WHERE status = 'draft'),
  0::bigint,
  'Anon cannot read draft products'
);

-- 4. Anon cannot read seller_kyc
RESET ROLE;
SELECT tests_set_auth('00000000-0000-0000-0000-000000000000', 'anon');
SELECT is(
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
SELECT is(
  (SELECT amount_minor FROM public.seller_ledger WHERE id = '60000000-0000-0000-0000-000000000000'),
  100::bigint,
  'Client cannot update seller_ledger (update should not change the row due to missing UPDATE policy)'
);

-- 6. User cannot change own role
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
UPDATE public.profiles SET role = 'superadmin' WHERE id = '33333333-3333-3333-3333-333333333333';
SELECT is(
  (SELECT role::text FROM public.profiles WHERE id = '33333333-3333-3333-3333-333333333333'),
  'customer',
  'User cannot change their own role'
);

-- 7. Client cannot insert an approved seller
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
INSERT INTO public.sellers (owner_profile_id, business_name, slug, status) VALUES ('33333333-3333-3333-3333-333333333333', 'Test', 'test', 'approved');
SELECT is(
  (SELECT status::text FROM public.sellers WHERE slug = 'test'),
  'pending',
  'Client inserted seller must default to pending'
);

-- 8. Seller cannot set a product active (only draft/pending_review/archived)
RESET ROLE;
SELECT tests_set_auth('11111111-1111-1111-1111-111111111111', 'authenticated');
INSERT INTO public.products (seller_id, category_id, title, slug, status) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Test Prod', 'test-slug', 'active');
SELECT is(
  (SELECT status::text FROM public.products WHERE slug = 'test-slug'),
  'draft',
  'Client inserted product must default to draft if tried to set active'
);

-- 9. Customer cannot set a return to refunded
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
SELECT throws_ok(
  $$ INSERT INTO public.returns (order_item_id, sub_order_id, reason, refund_minor, status) VALUES ('40000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000000', 'Reason', 100, 'requested') $$,
  '42501',
  NULL,
  'Customer cannot insert returns via client (SELECT-only policy)'
);

-- 10. Buyer cannot accept own offer
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
SELECT throws_ok(
  $$ INSERT INTO public.offers (variant_id, buyer_id, seller_id, offered_minor, status, expires_at) VALUES ('50000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50, 'accepted', pg_catalog.now()) $$,
  '42501',
  NULL,
  'Customer cannot insert offers via client (SELECT-only policy)'
);

-- 11. User cannot insert a second seller row
RESET ROLE;
SELECT tests_set_auth('11111111-1111-1111-1111-111111111111', 'authenticated');
SELECT throws_ok(
  $$ INSERT INTO public.sellers (owner_profile_id, business_name, slug, status) VALUES ('11111111-1111-1111-1111-111111111111', 'Seller A 2', 'seller-a-2', 'pending') $$,
  '23505',
  NULL,
  'User cannot insert a second seller row (unique index constraint)'
);

-- 12. Test dispute insert requirements
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
SELECT throws_ok(
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
SELECT throws_ok(
  $$ INSERT INTO public.reviews (profile_id, product_id, order_item_id, title, body, rating) VALUES ('33333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999', '40000000-0000-0000-0000-000000000000', 'Test', 'Body', 5) $$,
  '42501',
  NULL,
  'Customer cannot review a product mismatching the order item''s actual product'
);


-- 14. anon cannot execute private.is_superadmin()
RESET ROLE;
SELECT tests_set_auth('00000000-0000-0000-0000-000000000000', 'anon');
SELECT throws_ok(
  $$ SELECT private.is_superadmin() $$,
  '42501',
  NULL,
  'Anon cannot execute private.is_superadmin()'
);

-- 15. User cannot change own role to seller or admin_staff
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
UPDATE public.profiles SET role = 'seller' WHERE id = '33333333-3333-3333-3333-333333333333';
SELECT is(
  (SELECT role::text FROM public.profiles WHERE id = '33333333-3333-3333-3333-333333333333'),
  'customer',
  'User cannot change their own role to seller'
);

UPDATE public.profiles SET role = 'admin_staff' WHERE id = '33333333-3333-3333-3333-333333333333';
SELECT is(
  (SELECT role::text FROM public.profiles WHERE id = '33333333-3333-3333-3333-333333333333'),
  'customer',
  'User cannot change their own role to admin_staff'
);

-- 16. search_products only returns active products (never draft, even on a title match)
RESET ROLE;
SELECT tests_set_auth('00000000-0000-0000-0000-000000000000', 'anon');
SELECT is(
  (SELECT count(*) FROM public.search_products('Draft', 10, 0)),
  0::bigint,
  'search_products never returns draft products'
);

-- 17. search_products returns matching active products of approved sellers
-- (membership, not exact-set: the live catalog may contain other real rows
-- that also legitimately match the word "Active" in their description)
SELECT is(
  (SELECT bool_or(product_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee') FROM public.search_products('Active', 10, 0)),
  true,
  'search_products returns the matching active product'
);

-- 18. upsert_cart_item: increment-add creates the line at the requested qty
RESET ROLE;
SET local role postgres;
SELECT is(
  (SELECT out_quantity FROM public.upsert_cart_item(
    NULL, 'test-guest-token-cart-speed', '50000000-0000-0000-0000-000000000099', 3, true
  )),
  3,
  'upsert_cart_item increment-add sets quantity to the requested amount'
);

-- 19. upsert_cart_item: a second increment-add adds onto the existing line
SELECT is(
  (SELECT out_quantity FROM public.upsert_cart_item(
    NULL, 'test-guest-token-cart-speed', '50000000-0000-0000-0000-000000000099', 2, true
  )),
  5,
  'upsert_cart_item increment-add accumulates onto the existing line'
);

-- 20. upsert_cart_item: absolute set beyond available stock is capped
-- (available = 10 stock - 2 reserved = 8)
SELECT is(
  (SELECT out_quantity FROM public.upsert_cart_item(
    NULL, 'test-guest-token-cart-speed', '50000000-0000-0000-0000-000000000099', 99, false
  )),
  8,
  'upsert_cart_item caps an over-stock request at available stock'
);

-- 21. ...and reports the cap via out_adjusted
SELECT is(
  (SELECT out_adjusted FROM public.upsert_cart_item(
    NULL, 'test-guest-token-cart-speed', '50000000-0000-0000-0000-000000000099', 99, false
  )),
  true,
  'upsert_cart_item reports an over-stock request as adjusted'
);

-- 22. upsert_cart_item: absolute set to 0 removes the line entirely
SELECT is(
  (SELECT out_quantity FROM public.upsert_cart_item(
    NULL, 'test-guest-token-cart-speed', '50000000-0000-0000-0000-000000000099', 0, false
  )),
  0,
  'upsert_cart_item with quantity 0 removes the line'
);

-- 23. ...and the cart_items row is actually gone, not just reported as 0
SELECT is(
  (SELECT count(*) FROM public.cart_items ci
     JOIN public.carts c ON c.id = ci.cart_id
     WHERE c.guest_token = 'test-guest-token-cart-speed'
       AND ci.variant_id = '50000000-0000-0000-0000-000000000099'),
  0::bigint,
  'upsert_cart_item with quantity 0 actually deletes the cart_items row'
);

-- 24. upsert_cart_item: a variant on a draft (non-purchasable) product is rejected
SELECT throws_ok(
  $$ SELECT * FROM public.upsert_cart_item(
    NULL, 'test-guest-token-cart-speed', '50000000-0000-0000-0000-000000000098', 1, true
  ) $$,
  NULL,
  'This item is currently unavailable.',
  'upsert_cart_item rejects a variant belonging to a non-active product'
);

-- 25. upsert_cart_item: out-of-stock increment raises and keeps the existing line
SELECT public.upsert_cart_item(NULL, 'test-guest-out-of-stock', '50000000-0000-0000-0000-000000000099', 8, true);
UPDATE public.product_variants SET stock_quantity = 2, reserved_quantity = 2 WHERE id = '50000000-0000-0000-0000-000000000099';
SELECT throws_ok(
  $$ SELECT * FROM public.upsert_cart_item(
    NULL, 'test-guest-out-of-stock', '50000000-0000-0000-0000-000000000099', 1, true
  ) $$,
  'P0001',
  'This item is currently out of stock.',
  'upsert_cart_item increment raises when out of stock'
);

SELECT is(
  (SELECT quantity FROM public.cart_items ci
     JOIN public.carts c ON c.id = ci.cart_id
     WHERE c.guest_token = 'test-guest-out-of-stock'
       AND ci.variant_id = '50000000-0000-0000-0000-000000000099'),
  8,
  'existing line is kept unchanged when out of stock'
);

-- 26. two inserts of a cart for the same profile cannot both succeed
SELECT throws_ok(
  $$ INSERT INTO public.carts (profile_id, currency) VALUES ('33333333-3333-3333-3333-333333333333', 'PKR'); 
     INSERT INTO public.carts (profile_id, currency) VALUES ('33333333-3333-3333-3333-333333333333', 'PKR'); $$,
  '23505',
  NULL,
  'duplicate cart inserts for the same profile fail'
);

-- 27. quantity 100 is rejected
SELECT throws_ok(
  $$ SELECT * FROM public.upsert_cart_item(
    NULL, 'test-guest-qty-100', '50000000-0000-0000-0000-000000000099', 100, false
  ) $$,
  'P0001',
  'Quantity must be between 0 and 99.',
  'upsert_cart_item rejects quantity > 99'
);

-- 28. Customer cannot read another customer's wishlist
RESET ROLE;
SELECT tests_set_auth('44444444-4444-4444-4444-444444444444', 'authenticated');
INSERT INTO public.wishlists (profile_id, variant_id) VALUES ('44444444-4444-4444-4444-444444444444', '50000000-0000-0000-0000-000000000000');
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
SELECT is(
  (SELECT count(*) FROM public.wishlists),
  0::bigint,
  'Customer cannot read another customer''s wishlist'
);

-- 29. rating recalculates when a review is published
RESET ROLE;
SET local role postgres;
INSERT INTO public.order_items (id, sub_order_id, variant_id, product_title, variant_attributes, unit_price_minor, quantity, line_total_minor) VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000000', 'Title 2', '{}', 100, 1, 100);

INSERT INTO public.reviews (product_id, order_item_id, profile_id, rating, status) VALUES 
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '40000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 5, 'published');
SELECT is(
  (SELECT rating_avg FROM public.products WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  5.00::numeric,
  'Rating recalculates when a review is published'
);

-- 30. unpublished reviews do not count
INSERT INTO public.reviews (product_id, order_item_id, profile_id, rating, status) VALUES 
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '40000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 1, 'pending');
SELECT is(
  (SELECT rating_avg FROM public.products WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  5.00::numeric,
  'Unpublished reviews do not affect rating'
);

-- 31. customer cannot insert account deletion request with status processed
RESET ROLE;
SELECT tests_set_auth('33333333-3333-3333-3333-333333333333', 'authenticated');
SELECT throws_ok(
  $$ INSERT INTO public.account_deletion_requests (profile_id, status) VALUES ('33333333-3333-3333-3333-333333333333', 'processed') $$,
  '42501',
  NULL,
  'Customer cannot insert an account deletion request with status processed'
);

SELECT * FROM finish();
ROLLBACK;
