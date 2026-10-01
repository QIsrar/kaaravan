import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Image } from "@/components/ui/image";
import Link from "next/link";
import { ShieldCheck, Star, RotateCcw, Store, Sparkles, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ProductCard, type ProductCardProps } from "@/components/store/product-card";
import { PatternDivider } from "@/components/store/pattern-divider";
import { StoreCatalogFilters, type StoreCategoryOption } from "@/components/store/store-catalog-filters";
import { formatVariantLabel } from "@/lib/format/variant";

export const revalidate = 60;

interface StorePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

interface RawStoreVariant {
  id: string;
  sku: string;
  attributes: unknown;
  price_minor: number | string;
  compare_at_minor: number | string | null;
  is_active: boolean;
}

interface RawStoreImage {
  path: string;
  sort_order: number | null;
}

interface RawStoreProduct {
  id: string;
  title: string;
  slug: string;
  rating_avg: number | null;
  rating_count: number | null;
  category_id: string | null;
  category: { id: string; name: string; slug: string } | null;
  variants: RawStoreVariant[] | null;
  images: RawStoreImage[] | null;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: seller } = await supabase
    .from("sellers")
    .select("business_name, description")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!seller) {
    return {
      title: "Artisan Store — Kaaravan Marketplace",
    };
  }

  return {
    title: `${seller.business_name} — Verified Artisan Workshop | Kaaravan`,
    description: seller.description || `Explore authentic handcrafted items from ${seller.business_name} on Kaaravan.`,
  };
}

export default async function SellerStorePage({ params, searchParams }: StorePageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const tStore = await getTranslations("store");
  const tNav = await getTranslations("nav");
  const supabase = await createClient();

  // 1. Fetch seller profile
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, business_name, slug, logo, description, business_type, rating_avg, return_window_days")
    .eq("slug", slug)
    .eq("status", "approved")
    .is("deleted_at", null)
    .maybeSingle();

  if (!seller) {
    notFound();
  }

  // 2. Fetch all products by this seller to extract categories and filter
  let productQuery = supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      rating_avg,
      rating_count,
      category_id,
      category:categories (
        id,
        name,
        slug
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
    `)
    .eq("seller_id", seller.id)
    .eq("status", "active")
    .is("deleted_at", null);

  if (query.sort === "rating_desc") {
    productQuery = productQuery.order("rating_avg", { ascending: false });
  } else {
    productQuery = productQuery.order("created_at", { ascending: false });
  }

  const { data: rawProducts } = await productQuery;
  const allProducts = (rawProducts as unknown as RawStoreProduct[]) || [];

  // Extract distinct categories present in this seller's products
  const categoryMap = new Map<string, StoreCategoryOption>();
  for (const p of allProducts) {
    if (p.category) {
      categoryMap.set(p.category.id, {
        id: p.category.id,
        name: p.category.name,
        slug: p.category.slug,
      });
    }
  }
  const sellerCategories = Array.from(categoryMap.values());

  // Filter products by search, category, and price range
  const filteredProducts: ProductCardProps[] = [];

  for (const p of allProducts) {
    // Category filter
    if (query.category && p.category?.slug !== query.category) {
      continue;
    }

    // Search query filter within store
    if (query.q && query.q.trim()) {
      const qLower = query.q.toLowerCase().trim();
      const matchTitle = p.title.toLowerCase().includes(qLower);
      if (!matchTitle) continue;
    }

    const variants = (p.variants || [])
      .filter((v) => v.is_active)
      .sort((a, b) => Number(a.price_minor) - Number(b.price_minor));

    if (variants.length === 0) continue;
    const primaryVariant = variants[0];
    const priceMinor = Number(primaryVariant.price_minor);

    // Price range filters
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

    filteredProducts.push({
      id: p.id,
      title: p.title,
      slug: p.slug,
      image: primaryImage,
      sellerId: seller.id,
      sellerName: seller.business_name,
      sellerSlug: seller.slug,
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

  // Price sorting if requested
  if (query.sort === "price_asc") {
    filteredProducts.sort((a, b) => a.priceMinor - b.priceMinor);
  } else if (query.sort === "price_desc") {
    filteredProducts.sort((a, b) => b.priceMinor - a.priceMinor);
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">
          {tNav("home")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <span className="text-muted-foreground">{tStore("artisanGuilds")}</span>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <span className="text-foreground font-semibold"><bdi dir="auto">{seller.business_name}</bdi></span>
      </nav>

      {/* Seller Header Banner */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          {/* Logo frame */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-card border-2 border-primary/20 shadow-md relative overflow-hidden flex items-center justify-center shrink-0">
            {seller.logo ? (
              <Image
                src={seller.logo}
                alt={seller.business_name}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <Store className="w-12 h-12 text-primary" />
            )}
          </div>

          {/* Details */}
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{tStore("verifiedGuildMerchant")}</span>
            </div>

            <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              <bdi dir="auto">{seller.business_name}</bdi>
            </h1>

            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed" dir="auto">
              {seller.description || "Generational craft masters producing authentic Pakistani cultural pieces with verified provenance."}
            </p>

            {/* Badges / Metrics */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-foreground">
              <div className="flex items-center gap-1.5 bg-card/80 border border-border px-3 py-1.5 rounded-xl">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span>{tStore("merchantRating", { rating: Number(seller.rating_avg).toFixed(1) })}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-card/80 border border-border px-3 py-1.5 rounded-xl">
                <RotateCcw className="w-4 h-4 text-primary" />
                <span>{tStore("returnDays", { count: seller.return_window_days ?? 7 })}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-card/80 border border-border px-3 py-1.5 rounded-xl">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span>{tStore("craftsAvailable", { count: allProducts.length })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PatternDivider variant="tilework" className="py-2" />

      {/* Seller Product Catalog Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
              {tStore("masterworksAtelier", { name: seller.business_name })}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {tStore("showingMasterworks", { count: filteredProducts.length, total: allProducts.length })}
          </span>
        </div>

        {/* Layout with filters and product grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <StoreCatalogFilters
            categories={sellerCategories}
            currentCategory={query.category}
            currentSort={query.sort}
            currentMinPrice={query.minPrice}
            currentMaxPrice={query.maxPrice}
            currentSearch={query.q}
          />

          <div className="flex-1 w-full">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((item) => (
                  <ProductCard key={item.id} {...item} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card/60 space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  {tStore("noCraftsInWorkshop")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tStore("noCraftsInWorkshopDesc")}
                </p>
                <Link
                  href={`/store/${seller.slug}`}
                  className="inline-block text-xs text-primary font-bold hover:underline pt-2"
                >
                  {tStore("viewAllMasterworks")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
