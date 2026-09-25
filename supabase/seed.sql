DO $$
DECLARE
  superadmin_id UUID := pg_catalog.gen_random_uuid();
  seller1_id UUID := pg_catalog.gen_random_uuid();
  seller2_id UUID := pg_catalog.gen_random_uuid();
  seller3_id UUID := pg_catalog.gen_random_uuid();
  customer1_id UUID := pg_catalog.gen_random_uuid();
  
  s1_pk UUID;
  s2_pk UUID;
  s3_pk UUID;
  
  -- Parent Categories
  cat_electronics UUID := pg_catalog.gen_random_uuid();
  cat_fashion UUID := pg_catalog.gen_random_uuid();
  cat_home UUID := pg_catalog.gen_random_uuid();
  cat_beauty UUID := pg_catalog.gen_random_uuid();
  cat_sports UUID := pg_catalog.gen_random_uuid();
  
  -- Sub Categories
  cat_smartphones UUID := pg_catalog.gen_random_uuid();
  cat_laptops UUID := pg_catalog.gen_random_uuid();
  cat_mens_fashion UUID := pg_catalog.gen_random_uuid();
  cat_womens_fashion UUID := pg_catalog.gen_random_uuid();
  cat_skincare UUID := pg_catalog.gen_random_uuid();
  
  p_id UUID;
  v_id UUID;
  o_id UUID;
  so_id UUID;
BEGIN
  -- Insert into Supabase auth tables for local login.
  -- Notice we use crypt('password', gen_salt('bf')) from pgcrypto to properly hash the passwords for local login.
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES 
  (superadmin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'superadmin@kaaravan.pk', crypt('password123', gen_salt('bf')), pg_catalog.now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, pg_catalog.now(), pg_catalog.now(), '', '', '', ''),
  (seller1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seller1@kaaravan.pk', crypt('password123', gen_salt('bf')), pg_catalog.now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, pg_catalog.now(), pg_catalog.now(), '', '', '', ''),
  (seller2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seller2@kaaravan.pk', crypt('password123', gen_salt('bf')), pg_catalog.now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, pg_catalog.now(), pg_catalog.now(), '', '', '', ''),
  (seller3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seller3@kaaravan.pk', crypt('password123', gen_salt('bf')), pg_catalog.now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, pg_catalog.now(), pg_catalog.now(), '', '', '', ''),
  (customer1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer1@kaaravan.pk', crypt('password123', gen_salt('bf')), pg_catalog.now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, pg_catalog.now(), pg_catalog.now(), '', '', '', '');

  INSERT INTO public.profiles (id, full_name, phone, role, status) VALUES
  (superadmin_id, 'Super Admin', '03001234567', 'superadmin', 'active'),
  (seller1_id, 'Ali Traders', '03001234568', 'seller', 'active'),
  (seller2_id, 'Lahore Electronics', '03001234569', 'seller', 'active'),
  (seller3_id, 'Karachi Fashion', '03001234570', 'seller', 'active'),
  (customer1_id, 'Ahmed Customer', '03001234571', 'customer', 'active');

  INSERT INTO public.sellers (owner_profile_id, business_name, slug, status, return_window_days)
  VALUES 
  (seller1_id, 'Ali Traders', 'ali-traders', 'approved', 7) RETURNING id INTO s1_pk;
  
  INSERT INTO public.sellers (owner_profile_id, business_name, slug, status, return_window_days)
  VALUES 
  (seller2_id, 'Lahore Electronics', 'lahore-electronics', 'approved', 14) RETURNING id INTO s2_pk;
  
  INSERT INTO public.sellers (owner_profile_id, business_name, slug, status, return_window_days)
  VALUES 
  (seller3_id, 'Karachi Fashion', 'karachi-fashion', 'approved', 7) RETURNING id INTO s3_pk;

  -- 10 Categories in 2 levels
  INSERT INTO public.categories (id, name, slug, sort_order) VALUES
  (cat_electronics, 'Electronics', 'electronics', 1),
  (cat_fashion, 'Fashion', 'fashion', 2),
  (cat_home, 'Home & Lifestyle', 'home-lifestyle', 3),
  (cat_beauty, 'Health & Beauty', 'health-beauty', 4),
  (cat_sports, 'Sports & Outdoors', 'sports-outdoors', 5);

  INSERT INTO public.categories (id, parent_id, name, slug, sort_order) VALUES
  (cat_smartphones, cat_electronics, 'Smartphones', 'smartphones', 1),
  (cat_laptops, cat_electronics, 'Laptops', 'laptops', 2),
  (cat_mens_fashion, cat_fashion, 'Men''s Clothing', 'mens-clothing', 1),
  (cat_womens_fashion, cat_fashion, 'Women''s Clothing', 'womens-clothing', 2),
  (cat_skincare, cat_beauty, 'Skincare', 'skincare', 1);

  FOR i IN 1..40 LOOP
    INSERT INTO public.products (seller_id, category_id, title, slug, description, status)
    VALUES (
      CASE WHEN i % 3 = 0 THEN s1_pk WHEN i % 3 = 1 THEN s2_pk ELSE s3_pk END,
      CASE WHEN i % 2 = 0 THEN cat_smartphones ELSE cat_mens_fashion END,
      'Sample Product ' || i,
      'sample-product-' || i,
      'This is a sample product description.',
      'active'
    ) RETURNING id INTO p_id;
    
    INSERT INTO public.product_variants (product_id, sku, price_minor, stock_quantity, attributes)
    VALUES (p_id, 'SKU-' || i || '-A', (1000 + (i * 100)) * 100, 50, '{"size": "M"}'::jsonb);
    
    INSERT INTO public.product_variants (product_id, sku, price_minor, stock_quantity, attributes)
    VALUES (p_id, 'SKU-' || i || '-B', (1200 + (i * 100)) * 100, 30, '{"size": "L"}'::jsonb);
  END LOOP;

  FOR i IN 1..5 LOOP
    INSERT INTO public.orders (order_number, profile_id, shipping_address, billing_address, payment_method, payment_status, subtotal_minor, shipping_minor, total_minor)
    VALUES (
      'ORD-' || 1000 + i,
      customer1_id,
      '{"city": "Lahore"}'::jsonb,
      '{"city": "Lahore"}'::jsonb,
      'cod',
      'pending',
      200000, 15000, 215000
    ) RETURNING id INTO o_id;
    
    INSERT INTO public.sub_orders (order_id, seller_id, status, subtotal_minor, shipping_minor, total_minor)
    VALUES (o_id, s1_pk, 'pending', 200000, 15000, 215000) RETURNING id INTO so_id;
    
    SELECT id INTO v_id FROM public.product_variants LIMIT 1;
    
    INSERT INTO public.order_items (sub_order_id, variant_id, product_title, variant_attributes, unit_price_minor, quantity, line_total_minor)
    VALUES (so_id, v_id, 'Sample Title', '{}'::jsonb, 200000, 1, 200000);
  END LOOP;
END;
$$;
