/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { formatVariantLabel } from "@/lib/format/variant";
import { searchQuerySchema, MIN_SEARCH_QUERY_LENGTH } from "@/lib/validators/search";

export interface SearchProductResult {
  id: string;
  title: string;
  slug: string;
  image: string;
  sellerId: string;
  sellerName: string;
  sellerSlug: string;
  priceMinor: number;
  compareAtMinor: number | null;
  ratingAvg: number;
  ratingCount: number;
  primaryVariantId: string;
  primaryVariantLabel: string;
}

export interface SearchResult {
  query: string;
  products: SearchProductResult[];
}

export interface SearchSuggestion {
  id: string;
  title: string;
  slug: string;
  image: string;
  priceMinor: number;
}

interface SearchProductRow {
  id: string;
  title: string;
  slug: string;
  rating_avg: number | null;
  rating_count: number | null;
  seller: { id: string; business_name: string; slug: string; status: string } | null;
  variants: {
    id: string;
    sku: string;
    attributes: unknown;
    price_minor: number | bigint;
    compare_at_minor: number | bigint | null;
    is_active: boolean;
  }[] | null;
  images: { path: string; sort_order: number | null }[] | null;
}

/**
 * Resolves and validates a raw search query: trims whitespace, caps length at
 * MAX_SEARCH_QUERY_LENGTH. Returns null (instead of calling the database) for
 * queries shorter than MIN_SEARCH_QUERY_LENGTH after trimming.
 */
function resolveQuery(rawQuery: string): string | null {
  const query = searchQuerySchema.parse(rawQuery ?? "");
  if (query.length < MIN_SEARCH_QUERY_LENGTH) {
    return null;
  }
  return query;
}

async function rankedProductIds(
  supabase: SupabaseClient<Database>,
  query: string,
  limit: number,
  offset: number
): Promise<string[]> {
  const { data: matches, error } = await supabase.rpc("search_products", {
    q: query,
    lim: limit,
    off: offset,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return (matches || []).map((m) => m.product_id);
}

const PRODUCT_HYDRATION_SELECT = `
  id,
  title,
  slug,
  rating_avg,
  rating_count,
  seller:sellers (
    id,
    business_name,
    slug,
    status
  ),
  variants:product_variants (
    id,
    sku,
    attributes,
    price_minor,
    compare_at_minor,
    is_active
  ),
  images:product_images (
    path,
    sort_order
  )
`;

function toProductResult(p: SearchProductRow): SearchProductResult | null {
  const s = p.seller;
  if (!s || s.status !== "approved") return null;

  const variants = (p.variants || [])
    .filter((v) => v.is_active)
    .sort((a, b) => Number(a.price_minor) - Number(b.price_minor));
  if (variants.length === 0) return null;
  const primaryVariant = variants[0];

  const images = (p.images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    image: images[0]?.path || "/placeholder-product.svg",
    sellerId: s.id,
    sellerName: s.business_name,
    sellerSlug: s.slug,
    priceMinor: Number(primaryVariant.price_minor),
    compareAtMinor: primaryVariant.compare_at_minor ? Number(primaryVariant.compare_at_minor) : null,
    ratingAvg: Number(p.rating_avg) || 0,
    ratingCount: Number(p.rating_count) || 0,
    primaryVariantId: primaryVariant.id,
    primaryVariantLabel: formatVariantLabel(
      primaryVariant.attributes as Record<string, string | number> | null,
      primaryVariant.sku
    ),
  };
}

/**
 * Full-detail product search for the search results page.
 * Ranks via the search_products() RPC (full-text + trigram typo tolerance,
 * active products of approved sellers only), then hydrates the ranked IDs
 * with catalog details, preserving rank order.
 */
export async function searchProducts(
  supabase: SupabaseClient<Database>,
  rawQuery: string,
  limit = 24,
  offset = 0
): Promise<SearchResult> {
  const query = resolveQuery(rawQuery);
  if (query === null) {
    return { query: (rawQuery ?? "").trim().slice(0, 100), products: [] };
  }

  const ids = await rankedProductIds(supabase, query, limit, offset);
  if (ids.length === 0) {
    return { query, products: [] };
  }

  const { data: rawProducts, error } = await supabase
    .from("products")
    .select(PRODUCT_HYDRATION_SELECT)
    .in("id", ids);

  if (error) {
    throw new Error(`Search hydration failed: ${error.message}`);
  }

  const rowsById = new Map(
    ((rawProducts as unknown as SearchProductRow[]) || []).map((row) => [row.id, row])
  );

  const products: SearchProductResult[] = [];
  for (const id of ids) {
    const row = rowsById.get(id);
    if (!row) continue;
    const result = toProductResult(row);
    if (result) products.push(result);
  }

  return { query, products };
}

/**
 * Lightweight product search for the header's live autocomplete dropdown.
 */
export async function searchProductSuggestions(
  supabase: SupabaseClient<Database>,
  rawQuery: string,
  limit = 6
): Promise<{ query: string; suggestions: SearchSuggestion[] }> {
  const query = resolveQuery(rawQuery);
  if (query === null) {
    return { query: (rawQuery ?? "").trim().slice(0, 100), suggestions: [] };
  }

  const ids = await rankedProductIds(supabase, query, limit, 0);
  if (ids.length === 0) {
    return { query, suggestions: [] };
  }

  const { data: rawProducts, error } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      variants:product_variants ( price_minor, is_active ),
      images:product_images ( path, sort_order )
    `)
    .in("id", ids);

  if (error) {
    throw new Error(`Search suggestions failed: ${error.message}`);
  }

  interface SuggestionRow {
    id: string;
    title: string;
    slug: string;
    variants: { price_minor: number | bigint; is_active: boolean }[] | null;
    images: { path: string; sort_order: number | null }[] | null;
  }

  const rowsById = new Map(
    ((rawProducts as unknown as SuggestionRow[]) || []).map((row) => [row.id, row])
  );

  const suggestions: SearchSuggestion[] = [];
  for (const id of ids) {
    const row = rowsById.get(id);
    if (!row) continue;

    const activeVariants = (row.variants || [])
      .filter((v) => v.is_active)
      .sort((a, b) => Number(a.price_minor) - Number(b.price_minor));
    if (activeVariants.length === 0) continue;

    const images = (row.images || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    suggestions.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
      image: images[0]?.path || "/placeholder-product.svg",
      priceMinor: Number(activeVariants[0].price_minor),
    });
  }

  return { query, suggestions };
}
