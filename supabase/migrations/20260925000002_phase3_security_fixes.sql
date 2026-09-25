-- 1. Revoke access to private schema and functions from anon
REVOKE USAGE ON SCHEMA private FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM anon;

-- 2. Drop the storage SELECT policies that allow public read (listing is enough)
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read seller-branding" ON storage.objects;
DROP POLICY IF EXISTS "Public read banners" ON storage.objects;
