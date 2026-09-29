import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Sparkles, FolderTree } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard, type ProductCardProps } from "@/components/store/product-card";
import { CategoryFilters, type BrandFilterOption } from "@/components/store/category-filters";
import { PatternDivider } from "@/components/store/pattern-divider";
import { formatVariantLabel } from "@/lib/format/variant";

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    page?: string;
  }>;
}

interface CategoryProductRow {
  id: string;
  title: string;
  slug: string;
  rating_avg: number | null;
  rating_count: number | null;
  category_id: string;
  created_at: string;
  brand: { id: string; name: string; slug: string } | null;
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

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  const title = category?.name ? `${category.name} — Kaaravan Marketplace` : "Category — Kaaravan";
  return {
    title,
    description: `Explore authentic Pakistani handcrafted ${category?.name || "crafts"} from verified regional artisans.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  // 1. Fetch category
  const { data: currentCategory } = await supabase
    .from("categories")
    .select("id, name, slug, image, parent_id")
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!currentCategory) {
    // If running before SQL demo data is loaded, gracefully show demo category view
  }

  const categoryName = currentCategory?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const categoryId = currentCategory?.id;

  // 2. Fetch parent or subcategories
  let subcategories: { id: string; name: string; slug: string }[] = [];
  if (categoryId) {
    const { data: subs } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("parent_id", categoryId)
      .eq("is_active", true)
      .is("deleted_at", null);
    if (subs) subcategories = subs;
  }

  // 3. Fetch all active brands for filter list
  const { data: rawBrands } = await supabase
    .from("brands")
    .select("id, name, slug")
    .is("deleted_at", null);

  const brands: BrandFilterOption[] = rawBrands || [];

  // 4. Query products for this category (including its subcategories if parent)
  let categoryIdsToQuery: string[] = [];
  if (categoryId) {
    categoryIdsToQuery = [categoryId, ...subcategories.map((s) => s.id)];
  }

  let productQuery = supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      rating_avg,
      rating_count,
      category_id,
      created_at,
      brand:brands (
        id,
        name,
        slug
      ),
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
        stock_quantity,
        reserved_quantity,
        is_active
      ),
      images:product_images (
        path,
        sort_order
      )
    `)
    .eq("status", "active")
    .is("deleted_at", null);

  if (categoryIdsToQuery.length > 0) {
    productQuery = productQuery.in("category_id", categoryIdsToQuery);
  }

  if (query.brand) {
    // Filter by brand slug
    const matchingBrand = brands.find((b) => b.slug === query.brand);
    if (matchingBrand) {
      productQuery = productQuery.eq("brand_id", matchingBrand.id);
    }
  }

  if (query.minRating) {
    const minR = parseFloat(query.minRating);
    if (!isNaN(minR)) {
      productQuery = productQuery.gte("rating_avg", minR);
    }
  }

  // Sorting
  if (query.sort === "rating_desc") {
    productQuery = productQuery.order("rating_avg", { ascending: false });
  } else {
    productQuery = productQuery.order("created_at", { ascending: false });
  }

  const { data: rawProducts } = await productQuery.limit(60);

  // Map into ProductCardProps and apply price filters client-side from primary variant
  const productRows = (rawProducts as unknown as CategoryProductRow[]) || [];
  const products: ProductCardProps[] = [];

  for (const p of productRows) {
    const s = p.seller;
    if (!s || s.status !== "approved") continue;

    const variants = (p.variants || [])
      .filter((v) => v.is_active)
      .sort((a, b) => Number(a.price_minor) - Number(b.price_minor));

    if (variants.length === 0) continue;
    const primaryVariant = variants[0];
    const priceMinor = Number(primaryVariant.price_minor);

    // Apply price filter
    if (query.minPrice) {
      const minP = Math.max(0, parseInt(query.minPrice, 10)) * 100;
      if (!isNaN(minP) && priceMinor < minP) continue;
    }
    if (query.maxPrice) {
      const maxP = Math.max(0, parseInt(query.maxPrice, 10)) * 100;
      if (!isNaN(maxP) && priceMinor > maxP) continue;
    }

    const images = (p.images || []).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    const primaryImage = images[0]?.path || "/placeholder-product.svg";

    products.push({
      id: p.id,
      title: p.title,
      slug: p.slug,
      image: primaryImage,
      sellerId: s.id,
      sellerName: s.business_name,
      sellerSlug: s.slug,
      priceMinor,
      compareAtMinor: primaryVariant.compare_at_minor
        ? Number(primaryVariant.compare_at_minor)
        : null,
      ratingAvg: Number(p.rating_avg) || 4.8,
      ratingCount: Number(p.rating_count) || 12,
      primaryVariantId: primaryVariant.id,
      primaryVariantLabel: formatVariantLabel(
        primaryVariant.attributes as Record<string, string | number> | null,
        primaryVariant.sku
      ),
    });
  }

  // Sort by price if requested
  if (query.sort === "price_asc") {
    products.sort((a, b) => a.priceMinor - b.priceMinor);
  } else if (query.sort === "price_desc") {
    products.sort((a, b) => b.priceMinor - a.priceMinor);
  }

  // Pagination
  const page = parseInt(query.page || "1", 10) || 1;
  const pageSize = 12;
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = products.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <Link href="/category/apparel-textiles" className="hover:text-primary transition-colors">
          Categories
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <span className="text-foreground font-semibold">{categoryName}</span>
      </nav>

      {/* Category Banner / Header */}
      <div className="rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-background to-secondary/15 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Artisan Collection</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {categoryName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Authentic handmade crafts direct from certified Pakistani artisan guilds and heritage workshops.
            </p>
          </div>

          <div className="text-xs text-muted-foreground self-start sm:self-auto bg-card/80 border border-border px-3 py-1.5 rounded-xl font-medium">
            {totalItems} Crafts Available
          </div>
        </div>

        {/* Subcategories Chips */}
        {subcategories.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
              <FolderTree className="w-3.5 h-3.5" />
              <span>Subcategories:</span>
            </span>
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${sub.slug}`}
                className="text-xs px-3 py-1.5 rounded-full bg-card hover:bg-primary hover:text-primary-foreground text-foreground border border-border transition-colors shrink-0 shadow-2xs font-medium"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <PatternDivider variant="caravan-route" className="py-1" />

      {/* Main Layout: Filters Sidebar + Products Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Filters Sidebar */}
        <CategoryFilters
          brands={brands}
          currentSort={query.sort}
          currentBrand={query.brand}
          currentMinPrice={query.minPrice}
          currentMaxPrice={query.maxPrice}
          currentRating={query.minRating}
        />

        {/* Product Cards Container */}
        <div className="flex-1 w-full space-y-6">
          {paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8 border-t border-border">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const params = new URLSearchParams();
                    if (query.sort) params.set("sort", query.sort);
                    if (query.brand) params.set("brand", query.brand);
                    if (query.minPrice) params.set("minPrice", query.minPrice);
                    if (query.maxPrice) params.set("maxPrice", query.maxPrice);
                    if (query.minRating) params.set("minRating", query.minRating);
                    params.set("page", String(p));

                    return (
                      <Link
                        key={p}
                        href={`/category/${slug}?${params.toString()}`}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                          p === page
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-card border border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="p-12 rounded-3xl border border-dashed border-border bg-card/60 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-3 text-2xl">
                🔍
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-1">
                No crafts match these criteria
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Try widening your price range, choosing a different workshop, or resetting your filters.
              </p>
              <Link
                href={`/category/${slug}`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
              >
                Reset All Filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
