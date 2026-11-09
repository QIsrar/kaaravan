-- ============================================================================
-- Kaaravan Phase 8: pgTAP Tests for Financial Locks & Order Number Generation
-- Whole-PKR Standardized
-- ============================================================================
-- Tests:
-- 1-5.   orders financial immutability (subtotal_pkr, shipping_pkr, discount_pkr, total_pkr, currency)
-- 6-8.   sub_orders financial immutability (subtotal_pkr, shipping_pkr, total_pkr)
-- 9-12.  payments immutability (amount_pkr, order_id, gateway, method)
-- 13-14. payments status transitions allowed & audit-logged
-- 15-16. payouts immutability (amount_pkr, seller_id)
-- 17-18. payouts status transitions allowed & audit-logged
-- 19-20. order number generator non-sequential format (KV-XXXXXX) & uniqueness
-- 21.    orders table idempotency_key column presence & type
-- ============================================================================

BEGIN;
SELECT plan(21);

-- Setup test fixtures in transaction
CREATE OR REPLACE FUNCTION tests_setup_fixtures() RETURNS void AS $$
BEGIN
  -- Insert test users and profiles
  INSERT INTO auth.users (id, email) VALUES 
    ('88888888-8888-8888-8888-888888888888', 'pgtap_seller@kaaravan.pk'),
    ('99999999-9999-9999-9999-999999999999', 'pgtap_customer@kaaravan.pk')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, role, full_name) VALUES
    ('88888888-8888-8888-8888-888888888888', 'seller', 'pgTAP Seller Profile'),
    ('99999999-9999-9999-9999-999999999999', 'customer', 'pgTAP Customer Profile')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.sellers (id, owner_profile_id, business_name, slug, status) VALUES
    ('88888888-8888-8888-8888-000000000001', '88888888-8888-8888-8888-888888888888', 'pgTAP Seller Store', 'pgtap-seller-store', 'approved')
  ON CONFLICT (id) DO NOTHING;

  -- Insert test order
  INSERT INTO public.orders (
    id,
    order_number,
    profile_id,
    shipping_address,
    billing_address,
    payment_method,
    subtotal_pkr,
    shipping_pkr,
    discount_pkr,
    total_pkr,
    currency,
    idempotency_key
  ) VALUES (
    '88888888-8888-8888-8888-000000000002',
    'KV-TEST01',
    '99999999-9999-9999-9999-999999999999',
    '{"address": "Test street"}',
    '{"address": "Test street"}',
    'cod',
    5000,
    250,
    0,
    5250,
    'PKR',
    'pgtap-idempotency-key-01'
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert test sub_order
  INSERT INTO public.sub_orders (
    id,
    order_id,
    seller_id,
    status,
    subtotal_pkr,
    shipping_pkr,
    total_pkr
  ) VALUES (
    '88888888-8888-8888-8888-000000000003',
    '88888888-8888-8888-8888-000000000002',
    '88888888-8888-8888-8888-000000000001',
    'pending',
    5000,
    250,
    5250
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert test payment
  INSERT INTO public.payments (
    id,
    order_id,
    gateway,
    method,
    amount_pkr,
    status
  ) VALUES (
    '88888888-8888-8888-8888-000000000004',
    '88888888-8888-8888-8888-000000000002',
    'mock',
    'cod',
    5250,
    'pending'
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert test payout
  INSERT INTO public.payouts (
    id,
    seller_id,
    amount_pkr,
    status
  ) VALUES (
    '88888888-8888-8888-8888-000000000005',
    '88888888-8888-8888-8888-000000000001',
    3500,
    'requested'
  ) ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

SELECT tests_setup_fixtures();

-- ----------------------------------------------------------------------------
-- 1-5. Orders Money Column Locks (Immutability after INSERT)
-- ----------------------------------------------------------------------------
SELECT throws_ok(
  $$ UPDATE public.orders SET subtotal_pkr = 99999 WHERE id = '88888888-8888-8888-8888-000000000002' $$,
  'P0001',
  'Financial fields on orders (subtotal, shipping, discount, total, currency) are immutable after creation.',
  'Lock 1: orders.subtotal_pkr cannot be modified after insert'
);

SELECT throws_ok(
  $$ UPDATE public.orders SET shipping_pkr = 99999 WHERE id = '88888888-8888-8888-8888-000000000002' $$,
  'P0001',
  'Financial fields on orders (subtotal, shipping, discount, total, currency) are immutable after creation.',
  'Lock 2: orders.shipping_pkr cannot be modified after insert'
);

SELECT throws_ok(
  $$ UPDATE public.orders SET discount_pkr = 99999 WHERE id = '88888888-8888-8888-8888-000000000002' $$,
  'P0001',
  'Financial fields on orders (subtotal, shipping, discount, total, currency) are immutable after creation.',
  'Lock 3: orders.discount_pkr cannot be modified after insert'
);

SELECT throws_ok(
  $$ UPDATE public.orders SET total_pkr = 99999 WHERE id = '88888888-8888-8888-8888-000000000002' $$,
  'P0001',
  'Financial fields on orders (subtotal, shipping, discount, total, currency) are immutable after creation.',
  'Lock 4: orders.total_pkr cannot be modified after insert'
);

SELECT throws_ok(
  $$ UPDATE public.orders SET currency = 'USD' WHERE id = '88888888-8888-8888-8888-000000000002' $$,
  'P0001',
  'Financial fields on orders (subtotal, shipping, discount, total, currency) are immutable after creation.',
  'Lock 5: orders.currency cannot be modified after insert'
);

-- ----------------------------------------------------------------------------
-- 6-8. Sub-Orders Money Column Locks (Immutability after INSERT)
-- ----------------------------------------------------------------------------
SELECT throws_ok(
  $$ UPDATE public.sub_orders SET subtotal_pkr = 99999 WHERE id = '88888888-8888-8888-8888-000000000003' $$,
  'P0001',
  'Financial fields on sub_orders (subtotal, shipping, total) are immutable after creation.',
  'Lock 6: sub_orders.subtotal_pkr cannot be modified after insert'
);

SELECT throws_ok(
  $$ UPDATE public.sub_orders SET shipping_pkr = 99999 WHERE id = '88888888-8888-8888-8888-000000000003' $$,
  'P0001',
  'Financial fields on sub_orders (subtotal, shipping, total) are immutable after creation.',
  'Lock 7: sub_orders.shipping_pkr cannot be modified after insert'
);

SELECT throws_ok(
  $$ UPDATE public.sub_orders SET total_pkr = 99999 WHERE id = '88888888-8888-8888-8888-000000000003' $$,
  'P0001',
  'Financial fields on sub_orders (subtotal, shipping, total) are immutable after creation.',
  'Lock 8: sub_orders.total_pkr cannot be modified after insert'
);

-- ----------------------------------------------------------------------------
-- 9-12. Payments Money & Core Columns Locks
-- ----------------------------------------------------------------------------
SELECT throws_ok(
  $$ UPDATE public.payments SET amount_pkr = 99999 WHERE id = '88888888-8888-8888-8888-000000000004' $$,
  'P0001',
  'Payment amount, order_id, gateway and method are immutable after creation.',
  'Lock 9: payments.amount_pkr cannot be modified after insert'
);

SELECT throws_ok(
  $$ UPDATE public.payments SET order_id = '00000000-0000-0000-0000-000000000000' WHERE id = '88888888-8888-8888-8888-000000000004' $$,
  'P0001',
  'Payment amount, order_id, gateway and method are immutable after creation.',
  'Lock 10: payments.order_id cannot be modified after insert'
);

SELECT throws_ok(
  $$ UPDATE public.payments SET gateway = 'stripe' WHERE id = '88888888-8888-8888-8888-000000000004' $$,
  'P0001',
  'Payment amount, order_id, gateway and method are immutable after creation.',
  'Lock 11: payments.gateway cannot be modified after insert'
);

SELECT throws_ok(
  $$ UPDATE public.payments SET method = 'card' WHERE id = '88888888-8888-8888-8888-000000000004' $$,
  'P0001',
  'Payment amount, order_id, gateway and method are immutable after creation.',
  'Lock 12: payments.method cannot be modified after insert'
);

-- ----------------------------------------------------------------------------
-- 13-14. Payments Status Change Permitted & Logged to Audit Logs
-- ----------------------------------------------------------------------------
SELECT lives_ok(
  $$ UPDATE public.payments SET status = 'paid' WHERE id = '88888888-8888-8888-8888-000000000004' $$,
  'Lock 13: payments.status can be updated to paid'
);

SELECT is(
  (SELECT count(*) FROM public.audit_logs WHERE entity = 'payments' AND entity_id = '88888888-8888-8888-8888-000000000004'),
  1::bigint,
  'Lock 14: Payment status change triggers an immutable audit_log record'
);

-- ----------------------------------------------------------------------------
-- 15-16. Payouts Money & Seller Columns Locks
-- ----------------------------------------------------------------------------
SELECT throws_ok(
  $$ UPDATE public.payouts SET amount_pkr = 99999 WHERE id = '88888888-8888-8888-8888-000000000005' $$,
  'P0001',
  'Payout amount and seller_id are immutable after creation.',
  'Lock 15: payouts.amount_pkr cannot be modified after insert'
);

SELECT throws_ok(
  $$ UPDATE public.payouts SET seller_id = '00000000-0000-0000-0000-000000000000' WHERE id = '88888888-8888-8888-8888-000000000005' $$,
  'P0001',
  'Payout amount and seller_id are immutable after creation.',
  'Lock 16: payouts.seller_id cannot be modified after insert'
);

-- ----------------------------------------------------------------------------
-- 17-18. Payouts Status Change Permitted & Logged to Audit Logs
-- ----------------------------------------------------------------------------
SELECT lives_ok(
  $$ UPDATE public.payouts SET status = 'paid' WHERE id = '88888888-8888-8888-8888-000000000005' $$,
  'Lock 17: payouts.status can be updated to paid'
);

SELECT is(
  (SELECT count(*) FROM public.audit_logs WHERE entity = 'payouts' AND entity_id = '88888888-8888-8888-8888-000000000005'),
  1::bigint,
  'Lock 18: Payout status change triggers an immutable audit_log record'
);

-- ----------------------------------------------------------------------------
-- 19-20. Non-sequential Order Number Generator (KV-XXXXXX)
-- ----------------------------------------------------------------------------
SELECT matches(
  public.generate_order_number(),
  '^KV-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$',
  'Order Number 19: generate_order_number() produces valid non-sequential KV-XXXXXX string'
);

SELECT isnt(
  public.generate_order_number(),
  public.generate_order_number(),
  'Order Number 20: successive calls to generate_order_number() yield random non-sequential numbers'
);

-- ----------------------------------------------------------------------------
-- 21. Idempotency Key Presence on Orders
-- ----------------------------------------------------------------------------
SELECT has_column('public', 'orders', 'idempotency_key', 'Orders Schema 21: orders table possesses idempotency_key column');

SELECT * FROM finish();
ROLLBACK;
