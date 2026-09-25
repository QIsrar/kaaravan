-- Enums
CREATE TYPE role_type AS ENUM ('superadmin', 'admin_staff', 'seller', 'customer');
CREATE TYPE seller_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE product_status AS ENUM ('draft', 'pending_review', 'active', 'rejected', 'archived');
CREATE TYPE payment_method AS ENUM ('cod', 'jazzcash', 'easypaisa', 'card', 'bank_transfer');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE sub_order_status AS ENUM ('awaiting_confirmation', 'pending', 'confirmed', 'packed', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE ledger_entry_type AS ENUM ('sale', 'commission', 'shipping_fee', 'refund', 'adjustment', 'payout');
CREATE TYPE payout_status AS ENUM ('requested', 'approved', 'paid', 'failed');
CREATE TYPE return_status AS ENUM ('requested', 'approved', 'rejected', 'in_transit', 'received', 'refunded');
CREATE TYPE review_status AS ENUM ('pending', 'published', 'hidden');
CREATE TYPE offer_status AS ENUM ('pending', 'countered', 'accepted', 'rejected', 'expired');
CREATE TYPE cod_confirmation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'no_response');
CREATE TYPE coupon_discount_type AS ENUM ('percent', 'fixed');

-- Extensions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = pg_catalog.now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION append_only_trigger()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Updates and deletes are not allowed on this table.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'superadmin') INTO is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION current_seller_id()
RETURNS UUID AS $$
DECLARE
  s_id UUID;
BEGIN
  SELECT id INTO s_id
  FROM public.sellers
  WHERE owner_profile_id = auth.uid()
  LIMIT 1;
  
  RETURN s_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- IDENTITY
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role role_type NOT NULL DEFAULT 'customer',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  UNIQUE(profile_id, permission)
);
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_admin_permissions_profile_id ON public.admin_permissions(profile_id);

CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  street TEXT NOT NULL,
  postal_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_addresses_profile_id ON public.addresses(profile_id);
CREATE UNIQUE INDEX idx_addresses_default ON public.addresses(profile_id) WHERE is_default AND deleted_at IS NULL;
CREATE TRIGGER trigger_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SELLERS
CREATE TABLE public.sellers (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  owner_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  business_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  description TEXT,
  business_type TEXT,
  status seller_status NOT NULL DEFAULT 'pending',
  commission_rate_bps INT CHECK (commission_rate_bps >= 0 AND commission_rate_bps <= 10000),
  return_window_days INT NOT NULL DEFAULT 7 CHECK (return_window_days >= 0),
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sellers_owner_profile_id ON public.sellers(owner_profile_id);
CREATE INDEX idx_sellers_status ON public.sellers(status);
CREATE TRIGGER trigger_sellers_updated_at BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.seller_kyc (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  seller_id UUID NOT NULL UNIQUE REFERENCES public.sellers(id) ON DELETE CASCADE,
  cnic_number TEXT NOT NULL,
  ntn TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.seller_kyc ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trigger_seller_kyc_updated_at BEFORE UPDATE ON public.seller_kyc FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.seller_documents (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.seller_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_seller_documents_seller_id ON public.seller_documents(seller_id);
CREATE TRIGGER trigger_seller_documents_updated_at BEFORE UPDATE ON public.seller_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.seller_bank_accounts (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_title TEXT NOT NULL,
  iban TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.seller_bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_seller_bank_accounts_seller_id ON public.seller_bank_accounts(seller_id);
CREATE TRIGGER trigger_seller_bank_accounts_updated_at BEFORE UPDATE ON public.seller_bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.seller_pickup_addresses (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  street TEXT NOT NULL,
  postal_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.seller_pickup_addresses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_seller_pickup_addresses_seller_id ON public.seller_pickup_addresses(seller_id);
CREATE TRIGGER trigger_seller_pickup_addresses_updated_at BEFORE UPDATE ON public.seller_pickup_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CATALOG
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  parent_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  commission_rate_bps INT CHECK (commission_rate_bps >= 0 AND commission_rate_bps <= 10000),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE TRIGGER trigger_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trigger_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status product_status NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  rating_count INT NOT NULL DEFAULT 0,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_seller_id ON public.products(seller_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_brand_id ON public.products(brand_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_search_vector ON public.products USING GIN(search_vector);
CREATE INDEX idx_products_title_trgm ON public.products USING gin(title extensions.gin_trgm_ops);
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION products_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION products_search_vector_trigger();

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_minor BIGINT NOT NULL CHECK (price_minor >= 0),
  compare_at_minor BIGINT CHECK (compare_at_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'PKR',
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0 AND reserved_quantity <= stock_quantity),
  weight_grams INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  min_offer_minor BIGINT CHECK (min_offer_minor >= 0),
  offers_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (product_id, sku)
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE TRIGGER trigger_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_product_images_variant_id ON public.product_images(variant_id);
CREATE TRIGGER trigger_product_images_updated_at BEFORE UPDATE ON public.product_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- KAARAVAN SIGNATURE FEATURES
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  price_minor BIGINT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_price_history_variant_id ON public.price_history(variant_id);
CREATE TRIGGER trigger_price_history_append_only BEFORE UPDATE OR DELETE ON public.price_history FOR EACH ROW EXECUTE FUNCTION append_only_trigger();

CREATE OR REPLACE FUNCTION record_price_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.price_minor IS DISTINCT FROM OLD.price_minor THEN
    INSERT INTO public.price_history (variant_id, price_minor, recorded_at)
    VALUES (NEW.id, NEW.price_minor, pg_catalog.now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
CREATE TRIGGER tr_record_price_history AFTER INSERT OR UPDATE OF price_minor ON public.product_variants FOR EACH ROW EXECUTE FUNCTION record_price_history();

-- CART
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_token TEXT UNIQUE,
  currency TEXT NOT NULL DEFAULT 'PKR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CHECK (profile_id IS NOT NULL OR guest_token IS NOT NULL)
);
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_carts_profile_id ON public.carts(profile_id);
CREATE INDEX idx_carts_guest_token ON public.carts(guest_token);
CREATE TRIGGER trigger_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  UNIQUE (cart_id, variant_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_variant_id ON public.cart_items(variant_id);
CREATE TRIGGER trigger_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_phone TEXT,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
  shipping_minor BIGINT NOT NULL CHECK (shipping_minor >= 0),
  discount_minor BIGINT NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'PKR',
  placed_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_orders_profile_id ON public.orders(profile_id);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.sub_orders (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  status sub_order_status NOT NULL DEFAULT 'awaiting_confirmation',
  subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
  shipping_minor BIGINT NOT NULL CHECK (shipping_minor >= 0),
  total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.sub_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sub_orders_order_id ON public.sub_orders(order_id);
CREATE INDEX idx_sub_orders_seller_id ON public.sub_orders(seller_id);
CREATE INDEX idx_sub_orders_status ON public.sub_orders(status);
CREATE TRIGGER trigger_sub_orders_updated_at BEFORE UPDATE ON public.sub_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  sub_order_id UUID NOT NULL REFERENCES public.sub_orders(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  variant_attributes JSONB NOT NULL,
  unit_price_minor BIGINT NOT NULL CHECK (unit_price_minor >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total_minor BIGINT NOT NULL CHECK (line_total_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_order_items_sub_order_id ON public.order_items(sub_order_id);
CREATE INDEX idx_order_items_variant_id ON public.order_items(variant_id);
CREATE TRIGGER trigger_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  sub_order_id UUID NOT NULL REFERENCES public.sub_orders(id) ON DELETE CASCADE,
  from_status sub_order_status,
  to_status sub_order_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_order_status_history_sub_order_id ON public.order_status_history(sub_order_id);
CREATE TRIGGER trigger_order_status_history_append_only BEFORE UPDATE OR DELETE ON public.order_status_history FOR EACH ROW EXECUTE FUNCTION append_only_trigger();

-- MONEY
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  method payment_method NOT NULL,
  gateway TEXT NOT NULL,
  gateway_ref TEXT UNIQUE,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  status payment_status NOT NULL,
  raw_response JSONB,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  sub_order_id UUID NOT NULL UNIQUE REFERENCES public.sub_orders(id) ON DELETE RESTRICT,
  rate_bps INT NOT NULL CHECK (rate_bps >= 0 AND rate_bps <= 10000),
  base_minor BIGINT NOT NULL CHECK (base_minor >= 0),
  commission_minor BIGINT NOT NULL CHECK (commission_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_commissions_sub_order_id ON public.commissions(sub_order_id);
CREATE TRIGGER trigger_commissions_append_only BEFORE UPDATE OR DELETE ON public.commissions FOR EACH ROW EXECUTE FUNCTION append_only_trigger();

CREATE TABLE public.seller_ledger (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  sub_order_id UUID REFERENCES public.sub_orders(id) ON DELETE RESTRICT,
  entry_type ledger_entry_type NOT NULL,
  amount_minor BIGINT NOT NULL,
  balance_after_minor BIGINT NOT NULL,
  available_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.seller_ledger ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_seller_ledger_seller_id ON public.seller_ledger(seller_id);
CREATE INDEX idx_seller_ledger_sub_order_id ON public.seller_ledger(sub_order_id);
CREATE TRIGGER trigger_seller_ledger_append_only BEFORE UPDATE OR DELETE ON public.seller_ledger FOR EACH ROW EXECUTE FUNCTION append_only_trigger();

CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  status payout_status NOT NULL DEFAULT 'requested',
  bank_reference TEXT,
  paid_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payouts_seller_id ON public.payouts(seller_id);
CREATE TRIGGER trigger_payouts_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.cod_remittances (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  courier_code TEXT NOT NULL,
  remittance_reference TEXT NOT NULL UNIQUE,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  received_at TIMESTAMPTZ NOT NULL,
  reconciled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.cod_remittances ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cod_remittances_courier_code ON public.cod_remittances(courier_code);
CREATE TRIGGER trigger_cod_remittances_updated_at BEFORE UPDATE ON public.cod_remittances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- LOGISTICS
CREATE TABLE public.couriers (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  supports_cod BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trigger_couriers_updated_at BEFORE UPDATE ON public.couriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  sub_order_id UUID NOT NULL REFERENCES public.sub_orders(id) ON DELETE CASCADE,
  courier_code TEXT NOT NULL REFERENCES public.couriers(code) ON DELETE RESTRICT,
  tracking_number TEXT NOT NULL,
  status TEXT NOT NULL,
  cod_amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (cod_amount_minor >= 0),
  label_url TEXT,
  booked_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  UNIQUE (courier_code, tracking_number)
);
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_shipments_sub_order_id ON public.shipments(sub_order_id);
CREATE INDEX idx_shipments_courier_code ON public.shipments(courier_code);
CREATE INDEX idx_shipments_tracking_number ON public.shipments(tracking_number);
CREATE TRIGGER trigger_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.cod_remittance_items (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  remittance_id UUID NOT NULL REFERENCES public.cod_remittances(id) ON DELETE RESTRICT,
  shipment_id UUID NOT NULL UNIQUE REFERENCES public.shipments(id) ON DELETE RESTRICT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.cod_remittance_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cod_remittance_items_remittance_id ON public.cod_remittance_items(remittance_id);
CREATE INDEX idx_cod_remittance_items_shipment_id ON public.cod_remittance_items(shipment_id);

CREATE TABLE public.shipment_events (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  raw JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_shipment_events_shipment_id ON public.shipment_events(shipment_id);

CREATE TABLE public.bank_transfer_proofs (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.bank_transfer_proofs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_bank_transfer_proofs_order_id ON public.bank_transfer_proofs(order_id);
CREATE TRIGGER trigger_bank_transfer_proofs_updated_at BEFORE UPDATE ON public.bank_transfer_proofs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AFTER-SALES
CREATE TABLE public.returns (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
  sub_order_id UUID NOT NULL REFERENCES public.sub_orders(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  status return_status NOT NULL DEFAULT 'requested',
  refund_minor BIGINT NOT NULL CHECK (refund_minor >= 0),
  evidence_paths TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_returns_order_item_id ON public.returns(order_item_id);
CREATE INDEX idx_returns_sub_order_id ON public.returns(sub_order_id);
CREATE TRIGGER trigger_returns_updated_at BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  status review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_reviews_profile_id ON public.reviews(profile_id);
CREATE TRIGGER trigger_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  sub_order_id UUID NOT NULL REFERENCES public.sub_orders(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_disputes_sub_order_id ON public.disputes(sub_order_id);
CREATE TRIGGER trigger_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.dispute_messages (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_dispute_messages_dispute_id ON public.dispute_messages(dispute_id);

-- PLATFORM
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type coupon_discount_type NOT NULL,
  percent_bps INT CHECK (percent_bps >= 0 AND percent_bps <= 10000),
  fixed_minor BIGINT CHECK (fixed_minor >= 0),
  min_order_minor BIGINT CHECK (min_order_minor >= 0),
  max_discount_minor BIGINT CHECK (max_discount_minor >= 0),
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CHECK ((discount_type = 'percent' AND percent_bps IS NOT NULL AND fixed_minor IS NULL) OR (discount_type = 'fixed' AND fixed_minor IS NOT NULL AND percent_bps IS NULL))
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE TRIGGER trigger_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  discount_minor BIGINT NOT NULL CHECK (discount_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_coupon_redemptions_coupon_id ON public.coupon_redemptions(coupon_id);
CREATE INDEX idx_coupon_redemptions_order_id ON public.coupon_redemptions(order_id);

CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trigger_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_profile_id ON public.notifications(profile_id);

CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trigger_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MORE KAARAVAN SIGNATURE FEATURES
CREATE TABLE public.search_synonyms (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  term TEXT NOT NULL UNIQUE,
  maps_to TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trigger_search_synonyms_updated_at BEFORE UPDATE ON public.search_synonyms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  offered_minor BIGINT NOT NULL CHECK (offered_minor >= 0),
  counter_minor BIGINT CHECK (counter_minor >= 0),
  status offer_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_offers_variant_id ON public.offers(variant_id);
CREATE INDEX idx_offers_buyer_id ON public.offers(buyer_id);
CREATE INDEX idx_offers_seller_id ON public.offers(seller_id);
CREATE TRIGGER trigger_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.qafila_deals (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  target_buyers INT NOT NULL CHECK (target_buyers > 1),
  deal_price_minor BIGINT NOT NULL CHECK (deal_price_minor >= 0),
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.qafila_deals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_qafila_deals_variant_id ON public.qafila_deals(variant_id);
CREATE TRIGGER trigger_qafila_deals_updated_at BEFORE UPDATE ON public.qafila_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.qafila_participants (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.qafila_deals(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  UNIQUE (deal_id, buyer_id)
);
ALTER TABLE public.qafila_participants ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_qafila_participants_deal_id ON public.qafila_participants(deal_id);
CREATE INDEX idx_qafila_participants_buyer_id ON public.qafila_participants(buyer_id);

CREATE TABLE public.buyer_trust (
  phone_hash TEXT PRIMARY KEY,
  total_cod_orders INT NOT NULL DEFAULT 0,
  delivered INT NOT NULL DEFAULT 0,
  refused INT NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.buyer_trust ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trigger_buyer_trust_updated_at BEFORE UPDATE ON public.buyer_trust FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.cod_confirmations (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status cod_confirmation_status NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.cod_confirmations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cod_confirmations_order_id ON public.cod_confirmations(order_id);
CREATE TRIGGER trigger_cod_confirmations_updated_at BEFORE UPDATE ON public.cod_confirmations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  before JSONB,
  after JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity_entity_id ON public.audit_logs(entity, entity_id);
CREATE TRIGGER trigger_audit_logs_append_only BEFORE UPDATE OR DELETE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION append_only_trigger();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('seller-branding', 'seller-branding', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('banners', 'banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('seller-documents', 'seller-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]),
('payment-proofs', 'payment-proofs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]),
('return-evidence', 'return-evidence', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[])
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit, 
  allowed_mime_types = EXCLUDED.allowed_mime_types;
