-- =============================================================================
-- Kaaravan Marketplace — Phase 4 Demo Data
-- 10 Categories (2 levels), 3 Approved Sellers, 40 Products + Variants
-- Money stored in paisa (bigint). Images mapped to local /demo/ placeholder assets.
-- NOTE: Run with 'pnpm dlx supabase db query --linked -f supabase/demo/demo_data.sql' ONLY AFTER APPROVAL
-- =============================================================================

BEGIN;

-- 1. DEMO SELLER PROFILES
-- Setting role = 'seller' on existing auth users
INSERT INTO public.profiles (id, full_name, phone, role, status)
VALUES
  ('10def90d-80e6-49d0-8ee4-b49c2a476367', 'Tariq Mehmood Khan', '+920000000001', 'seller', 'active'),
  ('caf061d7-2d72-4edd-8a8e-a0817f297fe7', 'Gul Khan Afridi', '+920000000002', 'seller', 'active'),
  ('39d5d603-a839-443c-8547-5c2139a49c5b', 'Yasmin Begum Hunzai', '+920000000003', 'seller', 'active')
ON CONFLICT (id) DO UPDATE SET
  role = 'seller'::role_type,
  status = 'active',
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

-- 2. APPROVED DEMO SELLERS
INSERT INTO public.sellers (id, owner_profile_id, business_name, slug, logo, description, business_type, status, commission_rate_bps, return_window_days, rating_avg)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '10def90d-80e6-49d0-8ee4-b49c2a476367', 'Multan Kashikari & Crafts', 'multan-kashikari', '/demo/seller-kashikari.svg', 'Master artisans of authentic Multani blue pottery, hand-carved camel skin lamps, and traditional ceramic tableware.', 'Artisan Guild', 'approved', 800, 7, 4.90),
  ('a2222222-2222-2222-2222-222222222222', 'caf061d7-2d72-4edd-8a8e-a0817f297fe7', 'Khyber Heritage Leather', 'khyber-heritage-leather', '/demo/seller-peshawar-leather.svg', 'Handmade Peshawari chappals, Norozi sandals, and premium full-grain buffalo leather goods crafted in Namak Mandi, Peshawar.', 'Heritage Workshop', 'approved', 750, 7, 4.85),
  ('a3333333-3333-3333-3333-333333333333', '39d5d603-a839-443c-8547-5c2139a49c5b', 'Hunza Valley Organics & Textiles', 'hunza-organics-textiles', '/demo/seller-hunza-organics.svg', 'Pure mountain blossom honey, sun-dried apricots, hand-spun Pashmina shawls, and wild herbs from Gilgit-Baltistan.', 'Cooperative Enterprise', 'approved', 600, 10, 4.95)
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  slug = EXCLUDED.slug,
  logo = EXCLUDED.logo,
  description = EXCLUDED.description,
  status = 'approved',
  rating_avg = EXCLUDED.rating_avg;

-- 3. BRANDS
INSERT INTO public.brands (id, name, slug, logo)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Multan Kashikari', 'multan-kashikari', '/demo/cat-blue-pottery.svg'),
  ('d1000000-0000-0000-0000-000000000002', 'Chiniot Heritage', 'chiniot-heritage', '/demo/cat-brass-woodcraft.svg'),
  ('d1000000-0000-0000-0000-000000000003', 'Khyber Craft', 'khyber-craft', '/demo/cat-handcrafted-footwear.svg'),
  ('d1000000-0000-0000-0000-000000000004', 'Hunza Mountain Reserve', 'hunza-reserve', '/demo/cat-pure-spices.svg'),
  ('d1000000-0000-0000-0000-000000000005', 'Sindh Heritage', 'sindh-heritage', '/demo/cat-womens-artisanal.svg'),
  ('d1000000-0000-0000-0000-000000000006', 'Lahore Weavers Guild', 'lahore-weavers', '/demo/cat-apparel.svg')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  logo = EXCLUDED.logo;

-- 4. 10 CATEGORIES IN 2 LEVELS
-- Level 1 (Parents)
INSERT INTO public.categories (id, parent_id, name, slug, image, sort_order, commission_rate_bps, is_active)
VALUES
  ('b1000000-0000-0000-0000-000000000001', NULL, 'Apparel & Textiles', 'apparel-textiles', '/demo/cat-apparel.svg', 1, 600, TRUE),
  ('b1000000-0000-0000-0000-000000000002', NULL, 'Leather & Footwear', 'leather-footwear', '/demo/cat-leather.svg', 2, 700, TRUE),
  ('b1000000-0000-0000-0000-000000000003', NULL, 'Home & Pottery', 'home-pottery', '/demo/cat-home.svg', 3, 750, TRUE),
  ('b1000000-0000-0000-0000-000000000004', NULL, 'Spices & Organic Foods', 'spices-organic', '/demo/cat-spices.svg', 4, 500, TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, image = EXCLUDED.image, is_active = TRUE;

-- Level 2 (Subcategories)
INSERT INTO public.categories (id, parent_id, name, slug, image, sort_order, commission_rate_bps, is_active)
VALUES
  ('b2000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'Men''s Traditional Wear', 'mens-traditional', '/demo/cat-mens-traditional.svg', 1, 600, TRUE),
  ('b2000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'Women''s Artisanal Shawls & Dupattas', 'womens-artisanal', '/demo/cat-womens-artisanal.svg', 2, 600, TRUE),
  ('b2000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002', 'Handcrafted Heritage Footwear', 'handcrafted-footwear', '/demo/cat-handcrafted-footwear.svg', 3, 700, TRUE),
  ('b2000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000003', 'Multan Blue Pottery & Ceramics', 'blue-pottery-ceramics', '/demo/cat-blue-pottery.svg', 4, 750, TRUE),
  ('b2000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000003', 'Brass, Copper & Woodcraft', 'brass-woodcraft', '/demo/cat-brass-woodcraft.svg', 5, 750, TRUE),
  ('b2000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000004', 'Pure Mountain Spices & Honey', 'pure-spices-honey', '/demo/cat-pure-spices.svg', 6, 500, TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, image = EXCLUDED.image, is_active = TRUE;

-- 5. HOME BANNERS
INSERT INTO public.banners (id, title, image_url, link_url, sort_order, is_active)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Handcrafted Across Pakistan', '/demo/banner-caravan-1.svg', '/category/home-pottery', 1, TRUE),
  ('e1000000-0000-0000-0000-000000000002', 'Pure Mountain Harvests', '/demo/banner-caravan-2.svg', '/category/spices-organic', 2, TRUE),
  ('e1000000-0000-0000-0000-000000000003', 'The Heritage Leatherwork', '/demo/banner-caravan-3.svg', '/category/leather-footwear', 3, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url, is_active = TRUE;

-- 6. 40 ACTIVE PRODUCTS + 1-3 VARIANTS EACH
-- Delete previous detail image rows for demo products
DELETE FROM public.product_images WHERE id::text LIKE '91000000-0000-____-0000-000000000002';

-- Product #1: Multani Handcrafted Blue Pottery Flower Vase (Kashikari 10")
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000001', 'Multani Handcrafted Blue Pottery Flower Vase (Kashikari 10")', 'multani-handcrafted-blue-pottery-flower-vase-10-inch', 'Authentic Multan Blue Pottery flower vase featuring intricate Persian Kashikari hand-painted floral motifs. Baked in traditional wood-fired kilns using lead-free cobalt glaze. Each piece is individually crafted by master potters of Multan.', 'active', 4.9, 28)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0001-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'MK-VASE-10-COBALT', '{"color":"Cobalt Blue","size":"10 inch"}'::jsonb, 345000, 420000, 'PKR', 18, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0001-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'MK-VASE-12-TURQ', '{"color":"Turquoise","size":"12 inch"}'::jsonb, 465000, 550000, 'PKR', 12, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0001-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '/demo/prod-1.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #2: Chinioti Hand-Carved Sheesham Wood Serving Tray Set
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000002', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000002', 'Chinioti Hand-Carved Sheesham Wood Serving Tray Set', 'chinioti-hand-carved-sheesham-wood-serving-tray-set', 'Nest of two hand-carved serving trays crafted from seasoned Chinioti Sheesham (Dalbergia sissoo) rosewood. Embellished with brass inlay filigree work and polished with natural beeswax for a durable satin finish.', 'active', 4.85, 19)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0002-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'CH-TRAY-SET2', '{"set":"Set of 2","wood":"Sheesham"}'::jsonb, 580000, 690000, 'PKR', 15, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0002-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'CH-TRAY-SET3', '{"set":"Set of 3","wood":"Sheesham"}'::jsonb, 790000, 950000, 'PKR', 9, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0002-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', '/demo/prod-2.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #3: Multani Traditional Glazed Ceramic Chai Mugs (Set of 6)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000003', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000001', 'Multani Traditional Glazed Ceramic Chai Mugs (Set of 6)', 'multani-traditional-glazed-ceramic-chai-mugs-set-of-6', 'Six handmade tea mugs finished in classic Multan cobalt blue and white glazed ceramic. High-fired for thermal shock resistance, perfect for daily karak chai and traditional kahwa.', 'active', 4.95, 42)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0003-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'MK-MUG-SET6-BLUE', '{"set":"6 Mugs","color":"Royal Blue"}'::jsonb, 285000, 350000, 'PKR', 35, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0003-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'MK-MUG-SET6-TERRA', '{"set":"6 Mugs","color":"Terracotta"}'::jsonb, 285000, 350000, 'PKR', 20, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0003-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', '/demo/prod-3.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #4: Multan Hand-Painted Camel Skin Table Lamp (Naqqashi Art)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000004', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000001', 'Multan Hand-Painted Camel Skin Table Lamp (Naqqashi Art)', 'multan-hand-painted-camel-skin-table-lamp', 'Famous Multani camel skin table lamp painted with intricate Mughal Naqqashi lacquered miniature artwork. Casts a warm, enchanting golden glow when illuminated. Fitted with brass holder and standard E14 bulb socket.', 'active', 4.8, 14)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0004-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'MK-LAMP-S', '{"size":"10 inch"}'::jsonb, 420000, 490000, 'PKR', 10, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0004-0000-000000000002', 'c1000000-0000-0000-0000-000000000004', 'MK-LAMP-M', '{"size":"14 inch"}'::jsonb, 620000, 750000, 'PKR', 8, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0004-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 'MK-LAMP-L', '{"size":"18 inch"}'::jsonb, 890000, 1050000, 'PKR', 5, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0004-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', '/demo/prod-4.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #5: Hand-Hammered Solid Copper Chai Degchi (2 Litre)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000005', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000006', 'Hand-Hammered Solid Copper Chai Degchi (2 Litre)', 'hand-hammered-solid-copper-chai-degchi-2-litre', 'Traditional solid copper chai kettle hand-hammered by artisan coppersmiths. Tinned inside with pure food-grade kalai. Excellent thermal conductivity for preparing aromatic Kashmiri chai and strong dhood patti.', 'active', 4.9, 22)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0005-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'CU-DEGCHI-2L', '{"capacity":"2 Litre","material":"Pure Copper"}'::jsonb, 540000, 650000, 'PKR', 16, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0005-0000-000000000002', 'c1000000-0000-0000-0000-000000000005', 'CU-DEGCHI-3.5L', '{"capacity":"3.5 Litre","material":"Pure Copper"}'::jsonb, 720000, 880000, 'PKR', 10, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0005-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', '/demo/prod-5.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #6: Kashikari Blue Pottery Round Serving Platter (14")
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000006', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000001', 'Kashikari Blue Pottery Round Serving Platter (14")', 'kashikari-blue-pottery-round-serving-platter-14-inch', 'Grand circular wall display and banquet serving platter with symmetrical star and rosette arabesque motifs. Includes pre-drilled wall hanging slots on the underside.', 'active', 4.75, 16)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0006-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'MK-PLAT-14', '{"diameter":"14 inch","style":"Star Arabesque"}'::jsonb, 380000, 450000, 'PKR', 14, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0006-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', '/demo/prod-6.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #7: Chinioti Brass Inlay Wooden Coaster Set (Hexagonal, 6 Pcs)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000007', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000002', 'Chinioti Brass Inlay Wooden Coaster Set (Hexagonal, 6 Pcs)', 'chinioti-brass-inlay-wooden-coaster-set-hexagonal', 'Set of six solid sheesham wood coasters housed in a matching handcrafted hexagonal holder with ornate Pakistani brass wire inlays.', 'active', 4.88, 31)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0007-0000-000000000001', 'c1000000-0000-0000-0000-000000000007', 'CH-COAST-HEX6', '{"quantity":"6 Coasters","shape":"Hexagon"}'::jsonb, 175000, 220000, 'PKR', 40, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0007-0000-000000000001', 'c1000000-0000-0000-0000-000000000007', '/demo/prod-7.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #8: Gujranwala Heavy Brass Imam Dasta (Mortar & Pestle)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000008', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000006', 'Gujranwala Heavy Brass Imam Dasta (Mortar & Pestle)', 'gujranwala-heavy-brass-imam-dasta-mortar-pestle', 'Solid cast brass mortar and pestle forged in Gujranwala metal foundries. Designed for effortless hand-crushing of whole Pakistani spices, cardamom pods, and ginger-garlic pastes.', 'active', 4.92, 27)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0008-0000-000000000001', 'c1000000-0000-0000-0000-000000000008', 'GW-MORTAR-1.5KG', '{"weight":"1.5 kg"}'::jsonb, 420000, 490000, 'PKR', 15, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0008-0000-000000000002', 'c1000000-0000-0000-0000-000000000008', 'GW-MORTAR-2.5KG', '{"weight":"2.5 kg"}'::jsonb, 580000, 680000, 'PKR', 11, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0008-0000-000000000001', 'c1000000-0000-0000-0000-000000000008', '/demo/prod-8.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #9: Multani Ceramic Soup & Salan Bowls (Set of 4)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000009', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000001', 'Multani Ceramic Soup & Salan Bowls (Set of 4)', 'multani-ceramic-soup-salan-bowls-set-of-4', 'Hand-thrown pottery bowls glazed in indigo blue and leaf motifs. Ideal for serving daal, nihari, shorba, and halwa.', 'active', 4.7, 11)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0009-0000-000000000001', 'c1000000-0000-0000-0000-000000000009', 'MK-BOWL-4SET', '{"quantity":"4 Bowls","capacity":"500ml"}'::jsonb, 260000, 320000, 'PKR', 24, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0009-0000-000000000001', 'c1000000-0000-0000-0000-000000000009', '/demo/prod-9.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #10: Chiniot Rosewood Carved Tissue Box Cover
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000010', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000002', 'Chiniot Rosewood Carved Tissue Box Cover', 'chiniot-rosewood-carved-tissue-box-cover', 'Elegant slide-bottom tissue dispenser box made of dark sheesham timber with open jali carving and floral borders.', 'active', 4.65, 9)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0010-0000-000000000001', 'c1000000-0000-0000-0000-000000000010', 'CH-TISSUE-STD', '{"size":"Standard"}'::jsonb, 165000, 200000, 'PKR', 30, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0010-0000-000000000001', 'c1000000-0000-0000-0000-000000000010', '/demo/prod-10.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #11: Attock Terracotta Water Matka with Brass Dispenser Tap
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000011', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000001', 'Attock Terracotta Water Matka with Brass Dispenser Tap', 'attock-terracotta-water-matka-with-brass-dispenser-tap', 'Natural porous clay water vessel (Matka) naturally cools drinking water through evaporative micro-pores. Equipped with a heavy brass push-tap and clay lid.', 'active', 4.88, 17)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0011-0000-000000000001', 'c1000000-0000-0000-0000-000000000011', 'AT-MATKA-8L', '{"capacity":"8 Litre"}'::jsonb, 295000, 360000, 'PKR', 12, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0011-0000-000000000001', 'c1000000-0000-0000-0000-000000000011', '/demo/prod-11.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #12: Swat Valley Hand-Carved Walnut Wood Book Stand (Rehal)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000012', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000002', 'Swat Valley Hand-Carved Walnut Wood Book Stand (Rehal)', 'swat-valley-hand-carved-walnut-wood-book-stand-rehal', 'Traditional folding Rehal stand carved from single-piece aged Swat walnut wood. Decorated with intricate geometric trellis carvings. Folds completely flat.', 'active', 4.96, 34)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0012-0000-000000000001', 'c1000000-0000-0000-0000-000000000012', 'SW-REHAL-12', '{"size":"12 inch"}'::jsonb, 240000, 300000, 'PKR', 20, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0012-0000-000000000002', 'c1000000-0000-0000-0000-000000000012', 'SW-REHAL-15', '{"size":"15 inch"}'::jsonb, 320000, 390000, 'PKR', 15, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0012-0000-000000000001', 'c1000000-0000-0000-0000-000000000012', '/demo/prod-12.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #13: Multani Ceramic Handi Cooking Pot with Lid (1.5L)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000013', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000001', 'Multani Ceramic Handi Cooking Pot with Lid (1.5L)', 'multani-ceramic-handi-cooking-pot-with-lid-1-5l', 'Glazed stoneware Handi designed for slow-cooking mutton handi, dum biryani, and korma over gentle flames. Retains moisture and deep aromatic flavours.', 'active', 4.82, 20)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0013-0000-000000000001', 'c1000000-0000-0000-0000-000000000013', 'MK-HANDI-1.5L', '{"capacity":"1.5 Litre"}'::jsonb, 310000, 380000, 'PKR', 18, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0013-0000-000000000001', 'c1000000-0000-0000-0000-000000000013', '/demo/prod-13.webp', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #14: Handmade Brass Table Bell with Camel Bone Handle
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000014', 'a1111111-1111-1111-1111-111111111111', 'b2000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000006', 'Handmade Brass Table Bell with Camel Bone Handle', 'handmade-brass-table-bell-with-camel-bone-handle', 'Polished golden brass service bell with turned camel bone grip and clear resonant acoustic tone. A classic Pakistani desk and dining accent.', 'active', 4.7, 8)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0014-0000-000000000001', 'c1000000-0000-0000-0000-000000000014', 'BR-BELL-STD', '{"material":"Solid Brass"}'::jsonb, 145000, 180000, 'PKR', 25, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0014-0000-000000000001', 'c1000000-0000-0000-0000-000000000014', '/demo/prod-14.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #15: Peshawari Chappal - Traditional Leather Kaptaan Edition
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000015', 'a2222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000003', 'Peshawari Chappal - Traditional Leather Kaptaan Edition', 'peshawari-chappal-traditional-leather-kaptaan-edition', 'Iconic Kaptaan cut Peshawari chappal hand-crafted in Namak Mandi, Peshawar. Made from full-grain buff calfskin leather with comfortable memory padded insole and durable tyre tread sole.', 'active', 4.94, 65)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0015-0000-000000000001', 'c1000000-0000-0000-0000-000000000015', 'KHY-KAP-BLK-41', '{"color":"Matte Black","size":"41"}'::jsonb, 420000, 520000, 'PKR', 20, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0015-0000-000000000002', 'c1000000-0000-0000-0000-000000000015', 'KHY-KAP-BLK-42', '{"color":"Matte Black","size":"42"}'::jsonb, 420000, 520000, 'PKR', 25, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0015-0000-000000000003', 'c1000000-0000-0000-0000-000000000015', 'KHY-KAP-BRN-42', '{"color":"Mustard Tan","size":"42"}'::jsonb, 420000, 520000, 'PKR', 18, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0015-0000-000000000001', 'c1000000-0000-0000-0000-000000000015', '/demo/prod-15.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #16: Peshawari Norozi Double-Sole Handcrafted Chappal
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000016', 'a2222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000003', 'Peshawari Norozi Double-Sole Handcrafted Chappal', 'peshawari-norozi-double-sole-handcrafted-chappal', 'The classic Norozi design famous for its prominent front cross-cut and heavyweight double tire sole. Hand-stitched with waxed linen thread by generational cobblers.', 'active', 4.88, 39)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0016-0000-000000000001', 'c1000000-0000-0000-0000-000000000016', 'KHY-NOR-CHOC-42', '{"color":"Chocolate Brown","size":"42"}'::jsonb, 480000, 590000, 'PKR', 14, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0016-0000-000000000002', 'c1000000-0000-0000-0000-000000000016', 'KHY-NOR-CHOC-43', '{"color":"Chocolate Brown","size":"43"}'::jsonb, 480000, 590000, 'PKR', 16, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0016-0000-000000000001', 'c1000000-0000-0000-0000-000000000016', '/demo/prod-16.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #17: Sialkot Handcrafted Full-Grain Leather Messenger Laptop Bag
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000017', 'a2222222-2222-2222-2222-222222222222', 'b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'Sialkot Handcrafted Full-Grain Leather Messenger Laptop Bag', 'sialkot-handcrafted-full-grain-leather-messenger-laptop-bag', '15.6-inch laptop briefcase bag tanned in Sialkot with vegetable extracts. Features antique brass YKK hardware, padded laptop compartment, and an adjustable canvas-reinforced shoulder strap.', 'active', 4.91, 26)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0017-0000-000000000001', 'c1000000-0000-0000-0000-000000000017', 'SKT-BAG-TAN-15', '{"color":"Vintage Tan","size":"15.6 inch"}'::jsonb, 950000, 1200000, 'PKR', 12, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0017-0000-000000000002', 'c1000000-0000-0000-0000-000000000017', 'SKT-BAG-DKBRN-15', '{"color":"Dark Walnut","size":"15.6 inch"}'::jsonb, 950000, 1200000, 'PKR', 8, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0017-0000-000000000001', 'c1000000-0000-0000-0000-000000000017', '/demo/prod-17.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #18: Balochi Hand-Embroidered Traditional Men''s Waistcoat
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000018', 'a2222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003', 'Balochi Hand-Embroidered Traditional Men''s Waistcoat', 'balochi-hand-embroidered-traditional-mens-waistcoat', 'Royal Balochi ceremonial vest richly embroidered with silk threads and micro mirror needlework (Sheesha dozi) on premium midnight blue velvet fabric.', 'active', 4.87, 18)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0018-0000-000000000001', 'c1000000-0000-0000-0000-000000000018', 'BL-VEST-MED-BLUE', '{"size":"Medium","color":"Midnight Blue"}'::jsonb, 680000, 850000, 'PKR', 10, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0018-0000-000000000002', 'c1000000-0000-0000-0000-000000000018', 'BL-VEST-LRG-BLUE', '{"size":"Large","color":"Midnight Blue"}'::jsonb, 680000, 850000, 'PKR', 12, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0018-0000-000000000003', 'c1000000-0000-0000-0000-000000000018', 'BL-VEST-MED-MAROON', '{"size":"Medium","color":"Deep Maroon"}'::jsonb, 680000, 850000, 'PKR', 8, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0018-0000-000000000001', 'c1000000-0000-0000-0000-000000000018', '/demo/prod-18.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #19: Traditional Kolhapuri Tilla Embroidered Khussa for Men
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000019', 'a2222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000003', 'Traditional Kolhapuri Tilla Embroidered Khussa for Men', 'traditional-kolhapuri-tilla-embroidered-khussa-for-men', 'Artisanal men''s celebratory wedding khussa adorned with metallic gold tilla thread embroidery. Crafted from genuine goat leather with cushioned footbed.', 'active', 4.78, 23)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0019-0000-000000000001', 'c1000000-0000-0000-0000-000000000019', 'KH-KHUSSA-GLD-41', '{"color":"Gold","size":"41"}'::jsonb, 320000, 390000, 'PKR', 15, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0019-0000-000000000002', 'c1000000-0000-0000-0000-000000000019', 'KH-KHUSSA-GLD-42', '{"color":"Gold","size":"42"}'::jsonb, 320000, 390000, 'PKR', 18, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0019-0000-000000000001', 'c1000000-0000-0000-0000-000000000019', '/demo/prod-19.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #20: Handcrafted Vegetable Tanned Bifold Leather Wallet
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000020', 'a2222222-2222-2222-2222-222222222222', 'b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'Handcrafted Vegetable Tanned Bifold Leather Wallet', 'handcrafted-vegetable-tanned-bifold-leather-wallet', 'Slimline pocket wallet crafted from 100% full-grain cowhide leather. Holds 8 cards, currency bill partition, and RFID blocking lining for daily security.', 'active', 4.89, 45)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0020-0000-000000000001', 'c1000000-0000-0000-0000-000000000020', 'WL-BIFOLD-COGNAC', '{"color":"Cognac Brown"}'::jsonb, 185000, 240000, 'PKR', 40, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0020-0000-000000000002', 'c1000000-0000-0000-0000-000000000020', 'WL-BIFOLD-ONYX', '{"color":"Onyx Black"}'::jsonb, 185000, 240000, 'PKR', 35, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0020-0000-000000000001', 'c1000000-0000-0000-0000-000000000020', '/demo/prod-20.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #21: Pure Karakul Wool Jinnah Cap (Traditional Qaraqul)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000021', 'a2222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003', 'Pure Karakul Wool Jinnah Cap (Traditional Qaraqul)', 'pure-karakul-wool-jinnah-cap-traditional-qaraqul', 'The distinguished Qaraqul fleece cap famously worn by Quaid-e-Azam Muhammad Ali Jinnah. Hand-shaped with velvet interior lining and authentic curl luster.', 'active', 4.96, 30)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0021-0000-000000000001', 'c1000000-0000-0000-0000-000000000021', 'KQ-CAP-BLK-58', '{"color":"Black","size":"58 cm"}'::jsonb, 540000, 650000, 'PKR', 10, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0021-0000-000000000002', 'c1000000-0000-0000-0000-000000000021', 'KQ-CAP-GRY-58', '{"color":"Grey","size":"58 cm"}'::jsonb, 580000, 700000, 'PKR', 8, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0021-0000-000000000001', 'c1000000-0000-0000-0000-000000000021', '/demo/prod-21.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #22: Namak Mandi Peshawari Zalmi Cut Chappal
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000022', 'a2222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000003', 'Namak Mandi Peshawari Zalmi Cut Chappal', 'namak-mandi-peshawari-zalmi-cut-chappal', 'Youthful Zalmi cut featuring a streamlined toe box and yellow contrast welt stitching. Lightweight micro-cellular rubber sole for active daily wear.', 'active', 4.82, 28)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0022-0000-000000000001', 'c1000000-0000-0000-0000-000000000022', 'KHY-ZAL-41', '{"color":"Coal Black","size":"41"}'::jsonb, 380000, 460000, 'PKR', 20, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0022-0000-000000000002', 'c1000000-0000-0000-0000-000000000022', 'KHY-ZAL-42', '{"color":"Coal Black","size":"42"}'::jsonb, 380000, 460000, 'PKR', 22, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0022-0000-000000000001', 'c1000000-0000-0000-0000-000000000022', '/demo/prod-22.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #23: Hand-Crafted Full-Grain Leather Belt (Solid Brass Buckle)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000023', 'a2222222-2222-2222-2222-222222222222', 'b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'Hand-Crafted Full-Grain Leather Belt (Solid Brass Buckle)', 'hand-crafted-full-grain-leather-belt-solid-brass-buckle', 'Thick 38mm wide genuine saddle leather belt with hand-burnished edges and cast solid brass prong buckle. Built to last a lifetime.', 'active', 4.9, 33)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0023-0000-000000000001', 'c1000000-0000-0000-0000-000000000023', 'BLT-TAN-34', '{"color":"Tan","waist":"34 inch"}'::jsonb, 220000, 280000, 'PKR', 25, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0023-0000-000000000002', 'c1000000-0000-0000-0000-000000000023', 'BLT-TAN-36', '{"color":"Tan","waist":"36 inch"}'::jsonb, 220000, 280000, 'PKR', 20, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0023-0000-000000000003', 'c1000000-0000-0000-0000-000000000023', 'BLT-BLK-34', '{"color":"Black","waist":"34 inch"}'::jsonb, 220000, 280000, 'PKR', 22, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0023-0000-000000000001', 'c1000000-0000-0000-0000-000000000023', '/demo/prod-23.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #24: Gojra Handloom Heavy Khaddar Men''s Unstitched Suit
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000024', 'a2222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000006', 'Gojra Handloom Heavy Khaddar Men''s Unstitched Suit', 'gojra-handloom-heavy-khaddar-mens-unstitched-suit', '7 metres of genuine winter handloom khaddar woven on traditional Pakistani wooden pit-looms in Gojra, Punjab. Pure 100% breathable organic cotton.', 'active', 4.93, 40)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0024-0000-000000000001', 'c1000000-0000-0000-0000-000000000024', 'GJ-KHD-IVORY', '{"color":"Ivory","length":"7 metres"}'::jsonb, 360000, 440000, 'PKR', 30, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0024-0000-000000000002', 'c1000000-0000-0000-0000-000000000024', 'GJ-KHD-TEAL', '{"color":"Forest Teal","length":"7 metres"}'::jsonb, 390000, 470000, 'PKR', 18, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0024-0000-000000000001', 'c1000000-0000-0000-0000-000000000024', '/demo/prod-24.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #25: Peshawari Traditional Leather Duffle Gym & Travel Bag
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000025', 'a2222222-2222-2222-2222-222222222222', 'b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'Peshawari Traditional Leather Duffle Gym & Travel Bag', 'peshawari-traditional-leather-duffle-gym-travel-bag', 'Rugged weekender holdall duffle crafted from thick distressed oil-pull calf leather. Features heavy brass foot studs, reinforced handles, and side shoe pocket.', 'active', 4.86, 15)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0025-0000-000000000001', 'c1000000-0000-0000-0000-000000000025', 'DUF-BRN-50CM', '{"capacity":"35 Litre","color":"Antique Brown"}'::jsonb, 1150000, 1450000, 'PKR', 7, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0025-0000-000000000001', 'c1000000-0000-0000-0000-000000000025', '/demo/prod-25.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #26: Chitrali Woolen Pakol Cap & Feather Crest
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000026', 'a2222222-2222-2222-2222-222222222222', 'b2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003', 'Chitrali Woolen Pakol Cap & Feather Crest', 'chitrali-woolen-pakol-cap-and-feather-crest', 'Warm rolled soft woolen cap hand-spun by mountain weavers of Chitral. Keeps warmth trapped even in sub-zero winter temperatures.', 'active', 4.92, 38)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0026-0000-000000000001', 'c1000000-0000-0000-0000-000000000026', 'CHIT-PAKOL-CAMEL', '{"color":"Camel Brown"}'::jsonb, 160000, 200000, 'PKR', 35, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0026-0000-000000000002', 'c1000000-0000-0000-0000-000000000026', 'CHIT-PAKOL-CHAR', '{"color":"Charcoal"}'::jsonb, 160000, 200000, 'PKR', 25, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0026-0000-000000000001', 'c1000000-0000-0000-0000-000000000026', '/demo/prod-26.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #27: Hand-Stitched Leather Passport Holder & Travel Wallet
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000027', 'a2222222-2222-2222-2222-222222222222', 'b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'Hand-Stitched Leather Passport Holder & Travel Wallet', 'hand-stitched-leather-passport-holder-travel-wallet', 'Compact travel organizer holding two passports, boarding passes, currency notes, and international SIM ejector pin tool.', 'active', 4.77, 19)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0027-0000-000000000001', 'c1000000-0000-0000-0000-000000000027', 'TRV-PASS-TEAL', '{"color":"Caravan Teal"}'::jsonb, 195000, 250000, 'PKR', 30, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0027-0000-000000000001', 'c1000000-0000-0000-0000-000000000027', '/demo/prod-27.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #28: Pure Hand-Woven Kashmir Pashmina Shawl (Sozni Embroidery)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000028', 'a3333333-3333-3333-3333-333333333333', 'b2000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000004', 'Pure Hand-Woven Kashmir Pashmina Shawl (Sozni Embroidery)', 'pure-hand-woven-kashmir-pashmina-shawl-sozni-embroidery', 'Ultra-fine Grade A Himalayan Cashmere wool shawl spun by hand in Kashmir and the northern high valleys. Embellished with delicate Sozni needlepoint borders that took over 80 hours of meticulous hand-weaving.', 'active', 4.98, 52)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0028-0000-000000000001', 'c1000000-0000-0000-0000-000000000028', 'HNZ-PASH-IVORY', '{"color":"Natural Ivory","dimensions":"2m x 1m"}'::jsonb, 1450000, 1800000, 'PKR', 10, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0028-0000-000000000002', 'c1000000-0000-0000-0000-000000000028', 'HNZ-PASH-TEAL', '{"color":"Peacock Teal","dimensions":"2m x 1m"}'::jsonb, 1550000, 1950000, 'PKR', 7, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0028-0000-000000000001', 'c1000000-0000-0000-0000-000000000028', '/demo/prod-28.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #29: Ajrak Hand-Block Printed Pure Silk Dupatta (Sindh Heritage)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000029', 'a3333333-3333-3333-3333-333333333333', 'b2000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000005', 'Ajrak Hand-Block Printed Pure Silk Dupatta (Sindh Heritage)', 'ajrak-hand-block-printed-pure-silk-dupatta-sindh-heritage', 'Ancient 16-step natural indigo and madder root block-printed Ajrak on featherlight pure mulberry silk. Hand-stamped using carved Shisham wood blocks in Bhit Shah, Sindh.', 'active', 4.95, 36)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0029-0000-000000000001', 'c1000000-0000-0000-0000-000000000029', 'SND-AJRAK-INDIGO', '{"color":"Indigo / Terracotta","length":"2.5 Metres"}'::jsonb, 560000, 700000, 'PKR', 18, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0029-0000-000000000001', 'c1000000-0000-0000-0000-000000000029', '/demo/prod-29.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #30: Hunza Valley Sun-Dried Organic Apricots & Cold-Pressed Oil Gift Box
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000030', 'a3333333-3333-3333-3333-333333333333', 'b2000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000004', 'Hunza Valley Sun-Dried Organic Apricots & Cold-Pressed Oil Gift Box', 'hunza-valley-sun-dried-organic-apricots-cold-pressed-oil-gift-box', 'Farm-direct certified organic sun-dried sweet apricots (1kg) paired with a 250ml bottle of cold-pressed virgin apricot kernel oil rich in Vitamin E and antioxidants. Harvested from ancient high-altitude orchards along the Karakoram.', 'active', 4.96, 68)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0030-0000-000000000001', 'c1000000-0000-0000-0000-000000000030', 'HNZ-APRICOT-GIFT', '{"package":"Gift Set","weight":"1.25 kg"}'::jsonb, 295000, 360000, 'PKR', 45, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0030-0000-000000000002', 'c1000000-0000-0000-0000-000000000030', 'HNZ-APRICOT-2KG', '{"package":"Bulk Pack","weight":"2 kg"}'::jsonb, 340000, 420000, 'PKR', 30, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0030-0000-000000000001', 'c1000000-0000-0000-0000-000000000030', '/demo/prod-30.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #31: Gilgit Wild Mountain Blossom Raw Honeycomb (Natural 800g)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000031', 'a3333333-3333-3333-3333-333333333333', 'b2000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000004', 'Gilgit Wild Mountain Blossom Raw Honeycomb (Natural 800g)', 'gilgit-wild-mountain-blossom-raw-honeycomb-800g', 'Raw unprocessed mountain honey harvested directly with natural beeswax honeycomb from wild Apis dorsata bee colonies feeding on alpine wildflowers.', 'active', 4.97, 75)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0031-0000-000000000001', 'c1000000-0000-0000-0000-000000000031', 'GLG-HONEY-COMB-800G', '{"weight":"800g","packaging":"Hex Jar"}'::jsonb, 380000, 460000, 'PKR', 35, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0031-0000-000000000002', 'c1000000-0000-0000-0000-000000000031', 'GLG-HONEY-JAR-1.5KG', '{"weight":"1.5kg","packaging":"Pantry Tub"}'::jsonb, 620000, 750000, 'PKR', 20, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0031-0000-000000000001', 'c1000000-0000-0000-0000-000000000031', '/demo/prod-31.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #32: Himalayan Pink Rock Salt Culinary Cooking Slab & Ceramic Grinder
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000032', 'a3333333-3333-3333-3333-333333333333', 'b2000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000004', 'Himalayan Pink Rock Salt Culinary Cooking Slab & Ceramic Grinder', 'himalayan-pink-rock-salt-culinary-cooking-slab-ceramic-grinder', '100% natural Khewra salt slab (8" x 12" x 2") suitable for searing steaks, grilling tikka, and chilled sushi presentation. Includes a refillable ceramic spice grinder filled with coarse pink salt crystals.', 'active', 4.88, 31)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0032-0000-000000000001', 'c1000000-0000-0000-0000-000000000032', 'KHW-SALT-SLAB-SET', '{"weight":"4.5 kg","slabSize":"8x12x2 inch"}'::jsonb, 315000, 390000, 'PKR', 25, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0032-0000-000000000001', 'c1000000-0000-0000-0000-000000000032', '/demo/prod-32.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #33: Hand-Embroidered Zari Phulkari Velvet Shawl (Lahore Heritage)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000033', 'a3333333-3333-3333-3333-333333333333', 'b2000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000006', 'Hand-Embroidered Zari Phulkari Velvet Shawl (Lahore Heritage)', 'hand-embroidered-zari-phulkari-velvet-shawl-lahore-heritage', 'Opulent micro-velvet bridal wrap adorned with heavy antique gold Zari thread work and traditional Punjabi Phulkari floral medallions. Border finished with classic Kiran fringe lace.', 'active', 4.92, 29)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0033-0000-000000000001', 'c1000000-0000-0000-0000-000000000033', 'LHR-PHUL-MAROON', '{"color":"Royal Maroon","fabric":"Micro Velvet"}'::jsonb, 790000, 980000, 'PKR', 12, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;
INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0033-0000-000000000002', 'c1000000-0000-0000-0000-000000000033', 'LHR-PHUL-EMERALD', '{"color":"Emerald Green","fabric":"Micro Velvet"}'::jsonb, 790000, 980000, 'PKR', 10, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0033-0000-000000000001', 'c1000000-0000-0000-0000-000000000033', '/demo/prod-33.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #34: Skardu Karakoram Mountain Wild Green Tea & Herbs (Tin 250g)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000034', 'a3333333-3333-3333-3333-333333333333', 'b2000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000004', 'Skardu Karakoram Mountain Wild Green Tea & Herbs (Tin 250g)', 'skardu-karakoram-mountain-wild-green-tea-herbs-tin-250g', 'Sun-dried wild thyme (tumuro), peppermint, and loose-leaf highland green tea harvested above 2,500m elevation. Caffeine-free soothing kahwa blend.', 'active', 4.85, 44)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0034-0000-000000000001', 'c1000000-0000-0000-0000-000000000034', 'SKR-TEA-TIN-250G', '{"weight":"250g"}'::jsonb, 165000, 210000, 'PKR', 50, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0034-0000-000000000001', 'c1000000-0000-0000-0000-000000000034', '/demo/prod-34.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #35: Bahawalpur Chunri Silk Stole (Hand-Tied Bandhani)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000035', 'a3333333-3333-3333-3333-333333333333', 'b2000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000005', 'Bahawalpur Chunri Silk Stole (Hand-Tied Bandhani)', 'bahawalpur-chunri-silk-stole-hand-tied-bandhani', 'Authentic Cholistan desert Chunri tie-dyed on fine crushed silk. Thousands of tiny hand-tied knots dyed in vibrant festive shades of saffron, fuchsia, and mustard.', 'active', 4.84, 24)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0035-0000-000000000001', 'c1000000-0000-0000-0000-000000000035', 'BHW-CHUNRI-SAFF', '{"color":"Saffron / Magenta"}'::jsonb, 345000, 420000, 'PKR', 22, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0035-0000-000000000001', 'c1000000-0000-0000-0000-000000000035', '/demo/prod-35.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #36: Sindhi Ralli Patchwork Quilt (Handmade King Bedspread)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000036', 'a3333333-3333-3333-3333-333333333333', 'b1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000005', 'Sindhi Ralli Patchwork Quilt (Handmade King Bedspread)', 'sindhi-ralli-patchwork-quilt-handmade-king-bedspread', 'Heritage hand-quilted Ralli created by rural artisan women in lower Sindh. Features hundreds of pieced geometric cotton triangles with running kantha stitches.', 'active', 4.9, 16)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0036-0000-000000000001', 'c1000000-0000-0000-0000-000000000036', 'SND-RALLI-KING', '{"size":"King Bedspread","dimensions":"90x100 inch"}'::jsonb, 850000, 1050000, 'PKR', 8, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0036-0000-000000000001', 'c1000000-0000-0000-0000-000000000036', '/demo/prod-36.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #37: Organic Kasuri Methi & Peshawari Garam Masala Spice Pack
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000037', 'a3333333-3333-3333-3333-333333333333', 'b2000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000004', 'Organic Kasuri Methi & Peshawari Garam Masala Spice Pack', 'organic-kasuri-methi-peshawari-garam-masala-spice-pack', 'Fragrant shade-dried fenugreek leaves from Kasur, Punjab bundled with stone-ground Peshawar whole spice garam masala (black cumin, mace, cinnamon, star anise).', 'active', 4.91, 53)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0037-0000-000000000001', 'c1000000-0000-0000-0000-000000000037', 'KSR-SPICE-COMBO', '{"weight":"450g Total"}'::jsonb, 185000, 230000, 'PKR', 40, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0037-0000-000000000001', 'c1000000-0000-0000-0000-000000000037', '/demo/prod-37.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #38: Sindhi Mirror-Work (Sheesha) Hand-Embroidered Tote Bag
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000038', 'a3333333-3333-3333-3333-333333333333', 'b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000005', 'Sindhi Mirror-Work (Sheesha) Hand-Embroidered Tote Bag', 'sindhi-mirror-work-sheesha-hand-embroidered-tote-bag', 'Durable canvas shoulder tote embellished with tribal mirror embroidery, brass charms, and leather handles. Spacious interior with zipped security pocket.', 'active', 4.79, 21)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0038-0000-000000000001', 'c1000000-0000-0000-0000-000000000038', 'SND-TOTE-ECRU', '{"color":"Ecru / Indigo"}'::jsonb, 245000, 310000, 'PKR', 25, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0038-0000-000000000001', 'c1000000-0000-0000-0000-000000000038', '/demo/prod-38.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #39: Naran Valley Hand-Knitted Warm Woolen Socks (Pair of 3)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000039', 'a3333333-3333-3333-3333-333333333333', 'b2000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000004', 'Naran Valley Hand-Knitted Warm Woolen Socks (Pair of 3)', 'naran-valley-hand-knitted-warm-woolen-socks-pair-of-3', 'Extra-thick mountain wool socks hand-knitted on circular needles by women cooperatives in Naran and Kaghan. Natural thermal insulation for chilly winter floors.', 'active', 4.88, 37)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0039-0000-000000000001', 'c1000000-0000-0000-0000-000000000039', 'NRN-SOCK-3SET', '{"quantity":"3 Pairs","size":"Free Size"}'::jsonb, 165000, 210000, 'PKR', 45, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0039-0000-000000000001', 'c1000000-0000-0000-0000-000000000039', '/demo/prod-39.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

-- Product #40: Rawalpindi Brass Samovar Tea Urn (Charcoal Heated 4L)
INSERT INTO public.products (id, seller_id, category_id, brand_id, title, slug, description, status, rating_avg, rating_count)
VALUES ('c1000000-0000-0000-0000-000000000040', 'a3333333-3333-3333-3333-333333333333', 'b2000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000006', 'Rawalpindi Brass Samovar Tea Urn (Charcoal Heated 4L)', 'rawalpindi-brass-samovar-tea-urn-charcoal-heated-4l', 'Magnificent traditional brass samovar tea boiler with center chimney for hot charcoal embers. Decorated with embossed paisley filigree and twin wooden side handles.', 'active', 4.96, 14)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description, status = 'active', rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count;

INSERT INTO public.product_variants (id, product_id, sku, attributes, price_minor, compare_at_minor, currency, stock_quantity, is_active)
VALUES ('f1000000-0000-0040-0000-000000000001', 'c1000000-0000-0000-0000-000000000040', 'RAW-SAMOVAR-4L', '{"capacity":"4 Litre","material":"Cast Brass"}'::jsonb, 1650000, 2100000, 'PKR', 6, TRUE)
ON CONFLICT (product_id, sku) DO UPDATE SET price_minor = EXCLUDED.price_minor, compare_at_minor = EXCLUDED.compare_at_minor, stock_quantity = EXCLUDED.stock_quantity, is_active = TRUE;

INSERT INTO public.product_images (id, product_id, path, sort_order)
VALUES ('91000000-0000-0040-0000-000000000001', 'c1000000-0000-0000-0000-000000000040', '/demo/prod-40.svg', 1)
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path, sort_order = EXCLUDED.sort_order;

COMMIT;
