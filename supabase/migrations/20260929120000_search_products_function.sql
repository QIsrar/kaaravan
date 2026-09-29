-- Phase 4: safe full-text + typo-tolerant product search.
-- Replaces client-built PostgREST .or() filter strings (injection/parse risk from
-- raw user input containing commas, parentheses, quotes, dots) with a single
-- parameterized RPC. SECURITY INVOKER so the existing "Public read active products"
-- RLS policy still applies; the WHERE clause below additionally makes the
-- active/approved-seller restriction explicit and index-friendly.
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
