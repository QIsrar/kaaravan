-- ============================================================================
-- Veiled Canvas — E-Commerce Platform
-- Migration 002: Synthetic Seed Data
-- ============================================================================
-- All data is fictional. Names, emails, and addresses are generated.
-- No real personal information is used.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO categories (id, name, slug, description, image_url, sort_order) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Hijabs & Scarves', 'hijabs-scarves', 'Premium hijabs and scarves crafted from the finest fabrics for everyday elegance and special occasions.', '/images/categories/hijabs.jpg', 1),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Abayas & Dresses', 'abayas-dresses', 'Flowing abayas and modest dresses designed for comfort, style, and grace.', '/images/categories/abayas.jpg', 2),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Modest Sportswear', 'modest-sportswear', 'Performance-driven modest activewear for the modern, active woman.', '/images/categories/sportswear.jpg', 3),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Accessories', 'accessories', 'Curated accessories including pins, underscarves, and jewelry to complete your look.', '/images/categories/accessories.jpg', 4),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'New Arrivals', 'new-arrivals', 'The latest additions to our modest fashion collection.', '/images/categories/new-arrivals.jpg', 0);

-- ---------------------------------------------------------------------------
-- Products
-- Prices in INTEGER CENTS (e.g., 2999 = $29.99)
-- ---------------------------------------------------------------------------

-- Hijabs & Scarves
INSERT INTO products (id, category_id, title, slug, description, base_price, is_published) VALUES
  ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Premium Chiffon Hijab', 'premium-chiffon-hijab', 'Lightweight and breathable chiffon hijab with a soft, flowing drape. Perfect for daily wear and elegant occasions. Features a delicate hand-finished edge for a polished look.', 2499, true),
  ('b1b2c3d4-0002-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Jersey Cotton Hijab', 'jersey-cotton-hijab', 'Ultra-soft jersey cotton hijab that stays in place all day without pins. Stretchy, comfortable, and available in a range of versatile colors.', 1999, true),
  ('b1b2c3d4-0003-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Silk Blend Wrap', 'silk-blend-wrap', 'Luxurious silk blend scarf with a subtle sheen. Versatile enough for hijab styling or as an elegant shoulder wrap. Hand-rolled edges.', 4999, true),
  ('b1b2c3d4-0004-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Modal Hijab Collection', 'modal-hijab-collection', 'Our signature modal fabric hijab — buttery soft, crinkle-resistant, and incredibly lightweight. A wardrobe staple in every color.', 2299, true);

-- Abayas & Dresses
INSERT INTO products (id, category_id, title, slug, description, base_price, is_published) VALUES
  ('b1b2c3d4-0005-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', 'Classic Black Abaya', 'classic-black-abaya', 'Timeless black abaya with contemporary tailoring. Features elegant bell sleeves and a subtle A-line silhouette. Made from premium crepe fabric.', 8999, true),
  ('b1b2c3d4-0006-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', 'Embroidered Kimono Dress', 'embroidered-kimono-dress', 'Statement piece featuring intricate geometric embroidery on luxurious fabric. Open-front kimono style with matching inner dress.', 12999, true),
  ('b1b2c3d4-0007-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', 'Everyday Maxi Dress', 'everyday-maxi-dress', 'Effortlessly modest maxi dress with a relaxed fit, side pockets, and a clean neckline. Your go-to for casual days done right.', 5999, true),
  ('b1b2c3d4-0008-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', 'Linen Summer Abaya', 'linen-summer-abaya', 'Breathable pure linen abaya designed for warm weather. Features hidden buttons, patch pockets, and a relaxed collar.', 7499, true);

-- Modest Sportswear
INSERT INTO products (id, category_id, title, slug, description, base_price, is_published) VALUES
  ('b1b2c3d4-0009-4000-8000-000000000001', 'a1b2c3d4-0003-4000-8000-000000000003', 'Performance Swim Set', 'performance-swim-set', 'Full-coverage modest swimwear set with UPF 50+ protection. Quick-dry fabric, chlorine resistant, and designed for real athletic performance.', 6999, true),
  ('b1b2c3d4-0010-4000-8000-000000000001', 'a1b2c3d4-0003-4000-8000-000000000003', 'Sport Hijab Pro', 'sport-hijab-pro', 'Engineered for athletes. Moisture-wicking, anti-slip sport hijab with mesh ventilation zones and a secure pull-on fit.', 2999, true),
  ('b1b2c3d4-0011-4000-8000-000000000001', 'a1b2c3d4-0003-4000-8000-000000000003', 'Modest Running Set', 'modest-running-set', 'Lightweight running tunic and leggings set. Four-way stretch fabric, reflective details, and hidden zippered pockets.', 7999, true);

-- Accessories
INSERT INTO products (id, category_id, title, slug, description, base_price, is_published) VALUES
  ('b1b2c3d4-0012-4000-8000-000000000001', 'a1b2c3d4-0004-4000-8000-000000000004', 'Magnetic Hijab Pins Set', 'magnetic-hijab-pins-set', 'Set of 12 strong magnetic hijab pins with decorative tops. No more snagged fabric — secure hold without damage.', 1499, true),
  ('b1b2c3d4-0013-4000-8000-000000000001', 'a1b2c3d4-0004-4000-8000-000000000004', 'Bamboo Jersey Underscarf', 'bamboo-jersey-underscarf', 'Ultra-soft bamboo jersey underscarf with full coverage. Anti-bacterial, breathable, and stays put under any hijab style.', 999, true),
  ('b1b2c3d4-0014-4000-8000-000000000001', 'a1b2c3d4-0004-4000-8000-000000000004', 'Pearl Brooch Collection', 'pearl-brooch-collection', 'Elegant faux-pearl brooch set perfect for adding a touch of luxury to your hijab or abaya. Set of 3 unique designs.', 1999, true);

-- ---------------------------------------------------------------------------
-- Product Variants
-- additional_price in INTEGER CENTS (added to base_price)
-- ---------------------------------------------------------------------------

-- Premium Chiffon Hijab variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000001-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 'Dusty Rose', '#D4A0A0', 'CHF-DR-001', 45, 0, ARRAY['/images/products/chiffon-dusty-rose-1.jpg', '/images/products/chiffon-dusty-rose-2.jpg']),
  ('c1000001-0002-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 'Sage Green', '#9CAF88', 'CHF-SG-001', 32, 0, ARRAY['/images/products/chiffon-sage-1.jpg']),
  ('c1000001-0003-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 'Ivory', '#FFFFF0', 'CHF-IV-001', 58, 0, ARRAY['/images/products/chiffon-ivory-1.jpg']),
  ('c1000001-0004-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 'Deep Plum', '#4A0E2E', 'CHF-DP-001', 27, 200, ARRAY['/images/products/chiffon-plum-1.jpg']);

-- Jersey Cotton Hijab variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000002-0001-4000-8000-000000000001', 'b1b2c3d4-0002-4000-8000-000000000001', 'Black', '#1A1A1A', 'JCH-BK-001', 120, 0, ARRAY['/images/products/jersey-black-1.jpg']),
  ('c1000002-0002-4000-8000-000000000001', 'b1b2c3d4-0002-4000-8000-000000000001', 'Navy', '#1B2A4A', 'JCH-NV-001', 85, 0, ARRAY['/images/products/jersey-navy-1.jpg']),
  ('c1000002-0003-4000-8000-000000000001', 'b1b2c3d4-0002-4000-8000-000000000001', 'Mauve', '#C9A0DC', 'JCH-MV-001', 40, 0, ARRAY['/images/products/jersey-mauve-1.jpg']),
  ('c1000002-0004-4000-8000-000000000001', 'b1b2c3d4-0002-4000-8000-000000000001', 'Camel', '#C19A6B', 'JCH-CM-001', 65, 0, ARRAY['/images/products/jersey-camel-1.jpg']);

-- Silk Blend Wrap variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000003-0001-4000-8000-000000000001', 'b1b2c3d4-0003-4000-8000-000000000001', 'Champagne Gold', '#F7E7CE', 'SBW-CG-001', 20, 0, ARRAY['/images/products/silk-champagne-1.jpg']),
  ('c1000003-0002-4000-8000-000000000001', 'b1b2c3d4-0003-4000-8000-000000000001', 'Midnight Blue', '#191970', 'SBW-MB-001', 15, 0, ARRAY['/images/products/silk-midnight-1.jpg']),
  ('c1000003-0003-4000-8000-000000000001', 'b1b2c3d4-0003-4000-8000-000000000001', 'Blush', '#F5C6C6', 'SBW-BL-001', 22, 0, ARRAY['/images/products/silk-blush-1.jpg']);

-- Modal Hijab Collection variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000004-0001-4000-8000-000000000001', 'b1b2c3d4-0004-4000-8000-000000000001', 'Terracotta', '#CC7755', 'MDL-TC-001', 50, 0, ARRAY['/images/products/modal-terracotta-1.jpg']),
  ('c1000004-0002-4000-8000-000000000001', 'b1b2c3d4-0004-4000-8000-000000000001', 'Cloud White', '#F5F5F5', 'MDL-CW-001', 70, 0, ARRAY['/images/products/modal-white-1.jpg']),
  ('c1000004-0003-4000-8000-000000000001', 'b1b2c3d4-0004-4000-8000-000000000001', 'Olive', '#6B7B3A', 'MDL-OL-001', 35, 0, ARRAY['/images/products/modal-olive-1.jpg']);

-- Classic Black Abaya variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000005-0001-4000-8000-000000000001', 'b1b2c3d4-0005-4000-8000-000000000001', 'Classic Black', '#0A0A0A', 'ABA-CB-001', 30, 0, ARRAY['/images/products/abaya-black-1.jpg', '/images/products/abaya-black-2.jpg']),
  ('c1000005-0002-4000-8000-000000000001', 'b1b2c3d4-0005-4000-8000-000000000001', 'Charcoal', '#333333', 'ABA-CH-001', 18, 500, ARRAY['/images/products/abaya-charcoal-1.jpg']);

-- Embroidered Kimono Dress variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000006-0001-4000-8000-000000000001', 'b1b2c3d4-0006-4000-8000-000000000001', 'Emerald', '#2E6B4E', 'KMD-EM-001', 12, 0, ARRAY['/images/products/kimono-emerald-1.jpg']),
  ('c1000006-0002-4000-8000-000000000001', 'b1b2c3d4-0006-4000-8000-000000000001', 'Burgundy', '#722F37', 'KMD-BG-001', 8, 0, ARRAY['/images/products/kimono-burgundy-1.jpg']),
  ('c1000006-0003-4000-8000-000000000001', 'b1b2c3d4-0006-4000-8000-000000000001', 'Royal Navy', '#0C1445', 'KMD-RN-001', 10, 1000, ARRAY['/images/products/kimono-navy-1.jpg']);

-- Everyday Maxi Dress variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000007-0001-4000-8000-000000000001', 'b1b2c3d4-0007-4000-8000-000000000001', 'Dusty Blue', '#6E8FAE', 'MXD-DB-001', 40, 0, ARRAY['/images/products/maxi-blue-1.jpg']),
  ('c1000007-0002-4000-8000-000000000001', 'b1b2c3d4-0007-4000-8000-000000000001', 'Sand', '#D2B48C', 'MXD-SD-001', 55, 0, ARRAY['/images/products/maxi-sand-1.jpg']),
  ('c1000007-0003-4000-8000-000000000001', 'b1b2c3d4-0007-4000-8000-000000000001', 'Rust', '#B7410E', 'MXD-RS-001', 28, 0, ARRAY['/images/products/maxi-rust-1.jpg']);

-- Linen Summer Abaya variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000008-0001-4000-8000-000000000001', 'b1b2c3d4-0008-4000-8000-000000000001', 'Natural Linen', '#E8DCC8', 'LNA-NL-001', 25, 0, ARRAY['/images/products/linen-natural-1.jpg']),
  ('c1000008-0002-4000-8000-000000000001', 'b1b2c3d4-0008-4000-8000-000000000001', 'Soft Khaki', '#BDB76B', 'LNA-SK-001', 20, 0, ARRAY['/images/products/linen-khaki-1.jpg']);

-- Performance Swim Set variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000009-0001-4000-8000-000000000001', 'b1b2c3d4-0009-4000-8000-000000000001', 'Ocean Blue', '#0077BE', 'SWM-OB-001', 35, 0, ARRAY['/images/products/swim-blue-1.jpg']),
  ('c1000009-0002-4000-8000-000000000001', 'b1b2c3d4-0009-4000-8000-000000000001', 'Coral', '#FF6B6B', 'SWM-CR-001', 28, 0, ARRAY['/images/products/swim-coral-1.jpg']);

-- Sport Hijab Pro variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000010-0001-4000-8000-000000000001', 'b1b2c3d4-0010-4000-8000-000000000001', 'Jet Black', '#0D0D0D', 'SPH-JB-001', 90, 0, ARRAY['/images/products/sport-hijab-black-1.jpg']),
  ('c1000010-0002-4000-8000-000000000001', 'b1b2c3d4-0010-4000-8000-000000000001', 'Storm Grey', '#708090', 'SPH-SG-001', 60, 0, ARRAY['/images/products/sport-hijab-grey-1.jpg']),
  ('c1000010-0003-4000-8000-000000000001', 'b1b2c3d4-0010-4000-8000-000000000001', 'Teal', '#008080', 'SPH-TL-001', 45, 0, ARRAY['/images/products/sport-hijab-teal-1.jpg']);

-- Modest Running Set variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000011-0001-4000-8000-000000000001', 'b1b2c3d4-0011-4000-8000-000000000001', 'Midnight', '#191970', 'MRS-MN-001', 20, 0, ARRAY['/images/products/running-midnight-1.jpg']),
  ('c1000011-0002-4000-8000-000000000001', 'b1b2c3d4-0011-4000-8000-000000000001', 'Graphite', '#474747', 'MRS-GR-001', 22, 0, ARRAY['/images/products/running-graphite-1.jpg']);

-- Magnetic Hijab Pins Set variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000012-0001-4000-8000-000000000001', 'b1b2c3d4-0012-4000-8000-000000000001', 'Gold', '#D4AF37', 'MHP-GD-001', 200, 0, ARRAY['/images/products/pins-gold-1.jpg']),
  ('c1000012-0002-4000-8000-000000000001', 'b1b2c3d4-0012-4000-8000-000000000001', 'Silver', '#C0C0C0', 'MHP-SV-001', 180, 0, ARRAY['/images/products/pins-silver-1.jpg']),
  ('c1000012-0003-4000-8000-000000000001', 'b1b2c3d4-0012-4000-8000-000000000001', 'Rose Gold', '#B76E79', 'MHP-RG-001', 150, 200, ARRAY['/images/products/pins-rosegold-1.jpg']);

-- Bamboo Jersey Underscarf variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000013-0001-4000-8000-000000000001', 'b1b2c3d4-0013-4000-8000-000000000001', 'Black', '#0A0A0A', 'BJU-BK-001', 300, 0, ARRAY['/images/products/underscarf-black-1.jpg']),
  ('c1000013-0002-4000-8000-000000000001', 'b1b2c3d4-0013-4000-8000-000000000001', 'Nude', '#E8C39E', 'BJU-ND-001', 250, 0, ARRAY['/images/products/underscarf-nude-1.jpg']),
  ('c1000013-0003-4000-8000-000000000001', 'b1b2c3d4-0013-4000-8000-000000000001', 'White', '#FAFAFA', 'BJU-WH-001', 220, 0, ARRAY['/images/products/underscarf-white-1.jpg']);

-- Pearl Brooch Collection variants
INSERT INTO product_variants (id, product_id, color_name, color_hex, sku, stock_quantity, additional_price, images) VALUES
  ('c1000014-0001-4000-8000-000000000001', 'b1b2c3d4-0014-4000-8000-000000000001', 'Classic Pearl', '#FDEEF4', 'PBC-CP-001', 75, 0, ARRAY['/images/products/brooch-pearl-1.jpg']),
  ('c1000014-0002-4000-8000-000000000001', 'b1b2c3d4-0014-4000-8000-000000000001', 'Vintage Gold', '#CFB53B', 'PBC-VG-001', 60, 500, ARRAY['/images/products/brooch-gold-1.jpg']);

-- ---------------------------------------------------------------------------
-- Blog Posts
-- ---------------------------------------------------------------------------
INSERT INTO blog_posts (id, title, slug, excerpt, content, author_name, category, tags, read_time, is_published, published_at, cover_image) VALUES
  (
    'd1000001-0001-4000-8000-000000000001',
    '5 Ways to Style Your Hijab for Summer',
    '5-ways-to-style-hijab-summer',
    'Beat the heat without compromising your style. Discover our top hijab styling tips for the warmer months.',
    E'# 5 Ways to Style Your Hijab for Summer\n\nSummer doesn''t mean you have to sacrifice style or comfort. Here are our top picks for staying cool and looking fabulous.\n\n## 1. The Loose Turban Wrap\n\nPerfect for casual outings, the loose turban wrap keeps fabric away from your neck while looking effortlessly chic. Opt for lightweight chiffon or modal fabrics.\n\n## 2. The Side Drape\n\nA classic style that allows airflow. Simply wrap your hijab loosely and drape one end over your shoulder. Pair with statement earrings visible from the front.\n\n## 3. The Cap & Scarf Combo\n\nWear a breathable underscarf cap with a lighter, shorter scarf on top. This reduces layers while maintaining full coverage.\n\n## 4. The Half-Up Style\n\nGather the top portion and let the rest flow freely. Great with maxi dresses and adds a touch of elegance to any outfit.\n\n## 5. The Sport Wrap\n\nNot just for the gym! A moisture-wicking sport hijab paired with a casual outfit is the ultimate summer hack.\n\n---\n\n*What''s your favorite summer hijab style? Share with us on social media!*',
    'Amira Hassan',
    'Style Guide',
    ARRAY['hijab', 'summer', 'styling', 'fashion tips'],
    6,
    true,
    '2025-06-15T10:00:00Z',
    '/images/blog/summer-hijab.jpg'
  ),
  (
    'd1000001-0002-4000-8000-000000000001',
    'The Ethics Behind Our Supply Chain',
    'ethics-behind-our-supply-chain',
    'Transparency matters. Learn how Veiled Canvas ensures fair wages, sustainable materials, and ethical manufacturing.',
    E'# The Ethics Behind Our Supply Chain\n\nAt Veiled Canvas, we believe that beautiful fashion should never come at the cost of human dignity or environmental health.\n\n## Fair Wages, Fair Treatment\n\nEvery artisan and factory worker in our supply chain earns a living wage. We conduct quarterly audits and maintain long-term partnerships with manufacturers who share our values.\n\n## Sustainable Materials\n\nOver 70% of our fabrics are sourced from certified sustainable suppliers. Our chiffon collection uses recycled polyester, and our cotton is 100% organic.\n\n## Reduced Carbon Footprint\n\nWe''ve cut our shipping emissions by 40% since 2022 through consolidated shipments and carbon offset programs.\n\n## What''s Next\n\nBy 2026, we aim to achieve full supply chain transparency with blockchain-verified sourcing for every product.\n\n---\n\n*Read our full Sustainability Report on our About page.*',
    'Fatima Al-Rashid',
    'Behind the Brand',
    ARRAY['ethics', 'sustainability', 'supply chain', 'transparency'],
    8,
    true,
    '2025-05-20T09:00:00Z',
    '/images/blog/supply-chain.jpg'
  ),
  (
    'd1000001-0003-4000-8000-000000000001',
    'Modest Fashion at the Workplace: A Complete Guide',
    'modest-fashion-workplace-guide',
    'Navigating professional dress codes while staying true to your modest fashion values. Our comprehensive guide.',
    E'# Modest Fashion at the Workplace\n\nThe modern workplace is increasingly embracing diverse expressions of professionalism. Here''s how to build a modest workwear wardrobe that commands respect.\n\n## Building Your Capsule Wardrobe\n\n### The Essential Pieces\n- 2-3 tailored abayas in neutral tones\n- A structured blazer that layers beautifully\n- Wide-leg trousers in black and navy\n- 3-4 quality hijabs in solid professional colors\n\n## Color Theory for the Office\n\nStick to a cohesive palette: navy, black, grey, cream, and one accent color. This makes mixing and matching effortless.\n\n## Fabric Matters\n\nChoose fabrics that hold their structure throughout the day. Crepe, structured cotton, and wool blends are your friends. Avoid anything too sheer or clingy.\n\n## Accessorizing Professionally\n\nMagnetic hijab pins keep your look sleek. A quality watch and structured bag complete the professional image.\n\n---\n\n*Shop our Workwear Edit for curated professional modest fashion.*',
    'Nour Khatib',
    'Style Guide',
    ARRAY['workwear', 'professional', 'capsule wardrobe', 'office style'],
    10,
    true,
    '2025-04-10T14:00:00Z',
    '/images/blog/workplace-fashion.jpg'
  ),
  (
    'd1000001-0004-4000-8000-000000000001',
    'Caring for Your Premium Fabrics',
    'caring-for-premium-fabrics',
    'Extend the life of your hijabs and abayas with proper fabric care. Expert tips for washing, drying, and storing.',
    E'# Caring for Your Premium Fabrics\n\nYour Veiled Canvas pieces are crafted from premium materials. With proper care, they''ll maintain their beauty for years.\n\n## Chiffon Care\n- Hand wash in cold water with mild detergent\n- Never wring — gently press water out\n- Hang dry away from direct sunlight\n- Steam instead of ironing\n\n## Jersey & Modal Care\n- Machine wash on delicate cycle\n- Use a mesh laundry bag\n- Tumble dry on low or lay flat\n- Fold instead of hanging to prevent stretching\n\n## Silk Blend Care\n- Dry clean recommended\n- If hand washing, use silk-specific detergent\n- Roll in a towel to remove excess moisture\n- Store in a breathable garment bag\n\n## Storage Tips\n- Use padded hangers for abayas\n- Roll hijabs instead of folding to prevent creases\n- Keep in a cool, dry place away from direct sunlight\n- Add lavender sachets for freshness\n\n---\n\n*Have questions about caring for a specific product? Contact our customer care team.*',
    'Layla Mahmoud',
    'Care & Tips',
    ARRAY['fabric care', 'maintenance', 'washing', 'storage'],
    5,
    true,
    '2025-03-05T11:00:00Z',
    '/images/blog/fabric-care.jpg'
  ),
  (
    'd1000001-0005-4000-8000-000000000001',
    'Spring 2025 Collection Preview',
    'spring-2025-collection-preview',
    'Get an exclusive first look at our upcoming Spring collection. Fresh colors, new silhouettes, and exciting collaborations.',
    E'# Spring 2025 Collection Preview\n\nSpring is the season of renewal, and our latest collection embodies exactly that. Here''s your exclusive preview.\n\n## The Color Palette\n\nThis season, we''re drawing inspiration from Mediterranean gardens:\n- **Terracotta** — warm, earthy, and grounding\n- **Sage Green** — fresh and calming\n- **Dusty Rose** — soft and romantic\n- **Cloud White** — clean and versatile\n\n## New Silhouettes\n\n### The Structured Kimono\nA modern take on the traditional kimono with architectural lines and hidden closures.\n\n### The Wrap Maxi\nOur new wrap-style maxi dress features an adjustable waist and flutter sleeves.\n\n## Sustainability First\n\nEvery piece in the Spring collection is made from at least 50% sustainable materials. New organic linen options are our most eco-friendly yet.\n\n## Mark Your Calendar\n\nThe full collection drops March 21, 2025. Newsletter subscribers get 48-hour early access.\n\n---\n\n*Sign up for our newsletter to be the first to shop the Spring collection.*',
    'Veiled Canvas Team',
    'Collections',
    ARRAY['spring', 'new collection', 'preview', '2025'],
    7,
    true,
    '2025-02-28T08:00:00Z',
    '/images/blog/spring-collection.jpg'
  );

-- ---------------------------------------------------------------------------
-- Testimonials
-- Mix of product-specific reviews and general brand testimonials
-- ---------------------------------------------------------------------------
INSERT INTO testimonials (id, product_id, customer_name, location, collection_tag, rating, review_text, is_featured) VALUES
  ('e1000001-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 'Sarah M.', 'Toronto, Canada', 'Hijabs & Scarves', 5, 'The chiffon quality is incredible — lightweight yet opaque. The dusty rose color is exactly as pictured. My new everyday hijab!', true),
  ('e1000001-0002-4000-8000-000000000001', 'b1b2c3d4-0005-4000-8000-000000000001', 'Maryam K.', 'London, UK', 'Abayas & Dresses', 5, 'This abaya changed my wardrobe. The tailoring is impeccable and the fabric drapes beautifully. Worth every penny.', true),
  ('e1000001-0003-4000-8000-000000000001', 'b1b2c3d4-0010-4000-8000-000000000001', 'Hana R.', 'Sydney, Australia', 'Modest Sportswear', 5, 'Finally a sport hijab that actually stays in place during intense workouts. The ventilation is a game-changer. Ordered in every color!', true),
  ('e1000001-0004-4000-8000-000000000001', NULL, 'Zahra A.', 'Dubai, UAE', NULL, 5, 'Veiled Canvas understands modest fashion like no other brand. The quality, the designs, the customer service — everything is top-notch. My go-to for every occasion.', true),
  ('e1000001-0005-4000-8000-000000000001', 'b1b2c3d4-0006-4000-8000-000000000001', 'Aisha N.', 'New York, USA', 'Abayas & Dresses', 4, 'The embroidery on this kimono dress is stunning. Received so many compliments at my cousin''s wedding. Only reason for 4 stars is I wish it came in more colors.', true),
  ('e1000001-0006-4000-8000-000000000001', 'b1b2c3d4-0002-4000-8000-000000000001', 'Fatima S.', 'Kuala Lumpur, Malaysia', 'Hijabs & Scarves', 5, 'The jersey cotton is so soft against my skin. No pins needed — it stays perfectly in place. I have it in 4 colors now!', true),
  ('e1000001-0007-4000-8000-000000000001', NULL, 'Noor B.', 'Chicago, USA', NULL, 5, 'I love that Veiled Canvas is committed to ethical fashion. Knowing my clothes are sustainably made makes me feel even better wearing them.', false),
  ('e1000001-0008-4000-8000-000000000001', 'b1b2c3d4-0007-4000-8000-000000000001', 'Rania T.', 'Istanbul, Turkey', 'Abayas & Dresses', 4, 'Great everyday dress. The pockets are a huge plus! Fabric is comfortable but wrinkles a bit after sitting for long periods.', false),
  ('e1000001-0009-4000-8000-000000000001', 'b1b2c3d4-0012-4000-8000-000000000001', 'Layla H.', 'Riyadh, Saudi Arabia', 'Accessories', 5, 'These magnetic pins are revolutionary. No more pricked fingers or snagged fabric. The rose gold ones are beautiful.', false),
  ('e1000001-0010-4000-8000-000000000001', 'b1b2c3d4-0003-4000-8000-000000000001', 'Yasmin D.', 'Paris, France', 'Hijabs & Scarves', 5, 'The silk blend wrap is luxurious. I wore it to a formal dinner and received endless compliments. The hand-rolled edges are a beautiful detail.', true),
  ('e1000001-0011-4000-8000-000000000001', 'b1b2c3d4-0009-4000-8000-000000000001', 'Amina J.', 'Cape Town, South Africa', 'Modest Sportswear', 4, 'Great swim set! The UPF protection gives me peace of mind. The fabric dries quickly. Would love more color options in future.', false),
  ('e1000001-0012-4000-8000-000000000001', NULL, 'Khadija W.', 'Jakarta, Indonesia', NULL, 5, 'Shipping was fast, packaging was beautiful, and every piece exceeded my expectations. Veiled Canvas is my new favorite modest fashion brand.', true);

-- ---------------------------------------------------------------------------
-- Newsletter Subscribers (synthetic)
-- ---------------------------------------------------------------------------
INSERT INTO newsletter_subscribers (email, is_active, subscribed_at) VALUES
  ('test.subscriber1@example.com', true, '2025-01-15T08:30:00Z'),
  ('test.subscriber2@example.com', true, '2025-02-20T14:45:00Z'),
  ('test.subscriber3@example.com', true, '2025-03-10T09:00:00Z'),
  ('test.subscriber4@example.com', false, '2025-01-05T16:20:00Z'),
  ('test.subscriber5@example.com', true, '2025-04-01T11:00:00Z');

-- ---------------------------------------------------------------------------
-- Contact Submissions (synthetic)
-- ---------------------------------------------------------------------------
INSERT INTO contact_submissions (name, email, subject, message, status, created_at) VALUES
  ('Jane Doe', 'jane.doe@example.com', 'Order Inquiry', 'Hi, I placed an order last week (Order #12345) and haven''t received a tracking number yet. Could you please provide an update?', 'unread', '2025-06-18T09:30:00Z'),
  ('Ahmed Khan', 'ahmed.khan@example.com', 'Wholesale Partnership', 'I run a boutique in London and would love to discuss wholesale pricing for your hijab collection. Please contact me at your earliest convenience.', 'unread', '2025-06-17T15:00:00Z'),
  ('Maria Santos', 'maria.santos@example.com', 'Size Guide Question', 'Could you provide more detailed measurements for the Everyday Maxi Dress? I''m between sizes and want to make sure I order the right one.', 'resolved', '2025-06-15T11:45:00Z');

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
