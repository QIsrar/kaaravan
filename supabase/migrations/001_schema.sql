-- ============================================================================
-- Veiled Canvas — E-Commerce Platform
-- Migration 001: Complete Schema, Triggers, Indexes & RLS Policies
-- ============================================================================
-- Run this migration against your Supabase project via the SQL Editor
-- or using the Supabase CLI: supabase db push
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. CUSTOM TYPES (ENUMS)
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_status AS ENUM ('unread', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 profiles
-- Linked to auth.users via trigger (see Section 5).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  role        user_role NOT NULL DEFAULT 'customer',
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.2 addresses
-- Shipping addresses per user. Partial unique index enforces at most one
-- is_default = true per user_id.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_name  TEXT NOT NULL,
  street_address  TEXT NOT NULL,
  city            TEXT NOT NULL,
  state           TEXT,
  postal_code     TEXT NOT NULL,
  country         TEXT NOT NULL DEFAULT 'US',
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_one_default_per_user
  ON addresses (user_id)
  WHERE is_default = true;

-- ---------------------------------------------------------------------------
-- 3.3 categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.4 products
-- base_price stored as INTEGER cents. rating and review_count are
-- denormalized aggregates maintained by trigger (see Section 5).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  base_price    INTEGER NOT NULL CHECK (base_price >= 0),
  is_published  BOOLEAN NOT NULL DEFAULT false,
  is_archived   BOOLEAN NOT NULL DEFAULT false,
  rating        NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published) WHERE is_published = true AND is_archived = false;

-- ---------------------------------------------------------------------------
-- 3.5 product_variants
-- Each variant has a unique SKU, color, additional_price (cents delta),
-- stock_quantity, and images array pointing to Supabase Storage URLs.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  color_name       TEXT NOT NULL,
  color_hex        TEXT NOT NULL DEFAULT '#000000',
  size             TEXT,
  sku              TEXT UNIQUE NOT NULL,
  stock_quantity   INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  additional_price INTEGER NOT NULL DEFAULT 0,
  images           TEXT[] NOT NULL DEFAULT '{}',
  is_archived      BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- ---------------------------------------------------------------------------
-- 3.6 orders
-- total_amount stored as INTEGER cents. CHECK constraint ensures either
-- user_id (authenticated) or guest_email (guest checkout) is present.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_email         TEXT,
  status              order_status NOT NULL DEFAULT 'pending',
  total_amount        INTEGER NOT NULL CHECK (total_amount >= 0),
  currency            TEXT NOT NULL DEFAULT 'usd',
  stripe_session_id   TEXT,
  stripe_payment_intent TEXT,
  shipping_address_snapshot JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_order_customer CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);

-- ---------------------------------------------------------------------------
-- 3.7 order_items
-- ON DELETE RESTRICT on variant_id prevents hard-deleting variants that
-- have been purchased. price_at_purchase freezes the price at order time.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id        UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_title     TEXT NOT NULL,
  variant_label     TEXT NOT NULL,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase INTEGER NOT NULL CHECK (price_at_purchase >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);

-- ---------------------------------------------------------------------------
-- 3.8 blog_posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  excerpt      TEXT,
  content      TEXT NOT NULL DEFAULT '',
  cover_image  TEXT,
  author_name  TEXT NOT NULL DEFAULT 'Veiled Canvas Team',
  category     TEXT,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  read_time    INTEGER NOT NULL DEFAULT 5,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.9 testimonials
-- product_id is nullable: non-null = product review, null = general brand
-- testimonial. rating CHECK ensures 1–5 scale.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonials (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_avatar TEXT,
  location        TEXT,
  collection_tag  TEXT,
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text     TEXT NOT NULL,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_product ON testimonials(product_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured) WHERE is_featured = true;

-- ---------------------------------------------------------------------------
-- 3.10 newsletter_subscribers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.11 contact_submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_submissions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT,
  message    TEXT NOT NULL,
  status     contact_status NOT NULL DEFAULT 'unread',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3.12 stripe_events (Webhook Idempotency)
-- Tracks processed Stripe event IDs to prevent duplicate processing.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stripe_events (
  id           TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. HELPER FUNCTION: is_admin()
-- Used across all RLS policies to check if the current user has admin role.
-- ============================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 5.1 Auto-create profile on auth.users signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present to make migration idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- 5.2 Auto-update updated_at timestamp
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all mutable tables
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_variants_updated_at ON product_variants;
CREATE TRIGGER trg_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 5.3 Auto-refresh product rating/review_count from testimonials
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
BEGIN
  -- Determine which product to refresh
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  -- Skip if testimonial is not linked to a product
  IF target_product_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE products SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM testimonials
      WHERE product_id = target_product_id
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM testimonials
      WHERE product_id = target_product_id
    )
  WHERE id = target_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_testimonials_rating ON testimonials;
CREATE TRIGGER trg_testimonials_rating
  AFTER INSERT OR UPDATE OR DELETE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION refresh_product_rating();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on EVERY table. The database is the ultimate security boundary.

-- ---------------------------------------------------------------------------
-- 6.1 profiles
-- Users can read/update their own profile. Admins can read/update all.
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- Insert handled by trigger (SECURITY DEFINER), not direct user inserts
CREATE POLICY "profiles_insert_self"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 6.2 addresses
-- Users manage their own addresses. Admins can read all (for order fulfillment).
-- ---------------------------------------------------------------------------
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_select_own"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "addresses_insert_own"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update_own"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "addresses_delete_own"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- ---------------------------------------------------------------------------
-- 6.3 categories
-- Public read. Admin-only mutations.
-- ---------------------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 6.4 products
-- Public read (published, non-archived). Admin reads all + full mutations.
-- ---------------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (
    (is_published = true AND is_archived = false)
    OR is_admin()
  );

CREATE POLICY "products_insert_admin"
  ON products FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "products_update_admin"
  ON products FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 6.5 product_variants
-- Public read (non-archived, parent product published). Admin full access.
-- ---------------------------------------------------------------------------
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variants_select_public"
  ON product_variants FOR SELECT
  USING (
    (
      is_archived = false
      AND EXISTS (
        SELECT 1 FROM products
        WHERE products.id = product_variants.product_id
        AND products.is_published = true
        AND products.is_archived = false
      )
    )
    OR is_admin()
  );

CREATE POLICY "variants_insert_admin"
  ON product_variants FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "variants_update_admin"
  ON product_variants FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "variants_delete_admin"
  ON product_variants FOR DELETE
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 6.6 orders
-- Users see their own orders. Admins see all. Service role creates orders
-- in webhook handlers (bypasses RLS).
-- ---------------------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "orders_insert_authenticated"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- No delete policy — orders are never deleted

-- ---------------------------------------------------------------------------
-- 6.7 order_items
-- Visible to order owner. Admin full access.
-- ---------------------------------------------------------------------------
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "order_items_insert_admin"
  ON order_items FOR INSERT
  WITH CHECK (is_admin());

-- No update/delete — order items are immutable records

-- ---------------------------------------------------------------------------
-- 6.8 blog_posts
-- Public read (published only). Admin full CRUD.
-- ---------------------------------------------------------------------------
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_select_public"
  ON blog_posts FOR SELECT
  USING (is_published = true OR is_admin());

CREATE POLICY "blog_posts_insert_admin"
  ON blog_posts FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "blog_posts_update_admin"
  ON blog_posts FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "blog_posts_delete_admin"
  ON blog_posts FOR DELETE
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 6.9 testimonials
-- Public read (all featured + product-specific). Admin full CRUD.
-- ---------------------------------------------------------------------------
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testimonials_select_public"
  ON testimonials FOR SELECT
  USING (true);

CREATE POLICY "testimonials_insert_admin"
  ON testimonials FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "testimonials_update_admin"
  ON testimonials FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "testimonials_delete_admin"
  ON testimonials FOR DELETE
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 6.10 newsletter_subscribers
-- Anyone can INSERT (subscribe). Only admin can read/manage.
-- ---------------------------------------------------------------------------
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_insert_public"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "newsletter_select_admin"
  ON newsletter_subscribers FOR SELECT
  USING (is_admin());

CREATE POLICY "newsletter_update_admin"
  ON newsletter_subscribers FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "newsletter_delete_admin"
  ON newsletter_subscribers FOR DELETE
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 6.11 contact_submissions
-- Anyone can INSERT (submit inquiry). Only admin can read/manage.
-- ---------------------------------------------------------------------------
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_insert_public"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "contact_select_admin"
  ON contact_submissions FOR SELECT
  USING (is_admin());

CREATE POLICY "contact_update_admin"
  ON contact_submissions FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "contact_delete_admin"
  ON contact_submissions FOR DELETE
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- 6.12 stripe_events
-- Only service role (webhook handler) writes. Admin can read for debugging.
-- ---------------------------------------------------------------------------
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_events_select_admin"
  ON stripe_events FOR SELECT
  USING (is_admin());

-- INSERT/UPDATE handled by service role key (bypasses RLS)

-- ============================================================================
-- 7. STORAGE BUCKETS
-- ============================================================================
-- These must be run with service_role permissions or via Supabase Dashboard.
-- If running in SQL Editor, you have sufficient privileges.

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public read, admin-only write

-- product-images bucket policies
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "product_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND is_admin())
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());

-- blog-images bucket policies
CREATE POLICY "blog_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "blog_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'blog-images' AND is_admin());

CREATE POLICY "blog_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'blog-images' AND is_admin())
  WITH CHECK (bucket_id = 'blog-images' AND is_admin());

CREATE POLICY "blog_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'blog-images' AND is_admin());

-- ============================================================================
-- 8. CONVENIENCE VIEWS
-- ============================================================================

-- Product catalog view joining product + category for storefront queries
CREATE OR REPLACE VIEW product_catalog AS
SELECT
  p.id,
  p.title,
  p.slug,
  p.description,
  p.base_price,
  p.rating,
  p.review_count,
  p.is_published,
  p.is_archived,
  p.created_at,
  c.id AS category_id,
  c.name AS category_name,
  c.slug AS category_slug,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', pv.id,
        'color_name', pv.color_name,
        'color_hex', pv.color_hex,
        'size', pv.size,
        'sku', pv.sku,
        'stock_quantity', pv.stock_quantity,
        'additional_price', pv.additional_price,
        'images', pv.images,
        'is_archived', pv.is_archived
      )
    )
    FROM product_variants pv
    WHERE pv.product_id = p.id AND pv.is_archived = false
  ) AS variants
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_published = true AND p.is_archived = false;

-- ============================================================================
-- END OF MIGRATION 001
-- ============================================================================
