import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { HeroBanner, type BannerItem } from "@/components/store/hero-banner";
import { CategoryGrid, type CategoryCardData } from "@/components/store/category-grid";
import { ProductCard, type ProductCardProps } from "@/components/store/product-card";
import { RecentlyViewed } from "@/components/store/recently-viewed";
import { PatternDivider } from "@/components/store/pattern-divider";
import { Sparkles, Flame, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { formatVariantLabel } from "@/lib/format/variant";

// ISR: revalidate home page every 60 seconds
export const revalidate = 60;

export default async function HomePage() {
  const t = await getTranslations("store");
  const supabase = await createClient();

  // 1. Fetch active banners
  const { data: rawBanners } = await supabase
    .from("banners")
    .select("id, title, image_url, link_url, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const banners: BannerItem[] =
    rawBanners && rawBanners.length > 0
      ? rawBanners.map((b) => ({
          id: b.id,
          title: b.title,
          imageUrl: b.image_url || "/placeholder-product.svg",
          linkUrl: b.link_url,
        }))
      : [
          {
            id: "fallback-1",
            title: "Handcrafted Across Pakistan",
            imageUrl: "/demo/banner-textiles.jpg",
            linkUrl: "/category/apparel-textiles",
          },
          {
            id: "fallback-2",
            title: "Pure Mountain Harvests",
            imageUrl: "/demo/banner-mountain-harvest.jpg",
            linkUrl: "/category/spices-organic",
          },
          {
            id: "fallback-3",
            title: "Masterworks Multan Pottery",
            imageUrl: "/demo/banner-ceramics.jpg",
            linkUrl: "/category/home-pottery",
          },
        ];

  // 2. Fetch categories (Top-level + main active)
  const { data: rawCategories } = await supabase
    .from("categories")
    .select("id, name, slug, image, sort_order, parent_id")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  const categories: CategoryCardData[] =
    rawCategories && rawCategories.length > 0
      ? rawCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: c.image || "/placeholder-product.svg",
        }))
      : [
          { id: "c1", name: "Apparel & Textiles", slug: "apparel-textiles", image: "/demo/prod-pashmina-shawl.jpg" },
          { id: "c2", name: "Leather & Footwear", slug: "leather-footwear", image: "/demo/prod-peshawari-chappal.jpg" },
          { id: "c3", name: "Home & Pottery", slug: "home-pottery", image: "/demo/prod-blue-pottery.jpg" },
          { id: "c4", name: "Spices & Organics", slug: "spices-organic", image: "/demo/prod-pink-salt.jpg" },
        ];

  // 3. Fetch active products
  const { data: rawProducts } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      rating_avg,
      rating_count,
      seller:sellers (
        id,
        business_name,
        slug
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
    .is("deleted_at", null)
    .limit(40);

interface HomeProductRow {
  id: string;
  title: string;
  slug: string;
  rating_avg: number | null;
  rating_count: number | null;
  seller: { id: string; business_name: string; slug: string } | null;
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

  const productRows = (rawProducts as unknown as HomeProductRow[]) || [];
  const productCards: ProductCardProps[] = [];

  for (const p of productRows) {
    const s = p.seller;
    if (!s) continue;

    const variants = (p.variants || [])
      .filter((v) => v.is_active)
      .sort((a, b) => Number(a.price_minor) - Number(b.price_minor));

    if (variants.length === 0) continue;
    const primaryVariant = variants[0];

    const images = (p.images || []).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    const primaryImage = images[0]?.path || "/placeholder-product.svg";

    productCards.push({
      id: p.id,
      title: p.title,
      slug: p.slug,
      image: primaryImage,
      sellerId: s.id,
      sellerName: s.business_name,
      sellerSlug: s.slug,
      priceMinor: Number(primaryVariant.price_minor),
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

  // Deals: items with compareAt > price
  const dealProducts = productCards
    .filter((p) => p.compareAtMinor && p.compareAtMinor > p.priceMinor)
    .slice(0, 8);

  // Best sellers: sorted by rating and count
  const bestSellers = [...productCards]
    .sort((a, b) => (b.ratingAvg || 0) * (b.ratingCount || 0) - (a.ratingAvg || 0) * (a.ratingCount || 0))
    .slice(0, 8);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 space-y-12 sm:space-y-16">
      {/* 1. HERO BANNERS */}
      <section>
        <HeroBanner banners={banners} />
      </section>

      {/* 2. CATEGORY EXPLORATION GRID */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {t("categories")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Centuries of Pakistani craftsmanship across 8 regions
              </p>
            </div>
          </div>
          <Link
            href="/category/apparel-textiles"
            className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>{t("viewAll")}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>

        <CategoryGrid categories={categories} />
      </section>

      <PatternDivider variant="tilework" className="py-2" />

      {/* 3. FEATURED DEALS */}
      {dealProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  {t("featuredDeals")}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("dealsSubtitle")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {dealProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}

      {/* 4. BEST SELLERS / CARAVAN TREASURES */}
      {bestSellers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/30 text-primary flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  {t("bestSellers")}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("bestSellersSubtitle")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State Banner if no products in DB yet */}
      {productCards.length === 0 && (
        <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-border bg-card/60 text-center max-w-2xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-3xl">
            🏺
          </div>
          <h3 className="font-heading text-xl font-bold text-foreground mb-2">
            The Kaaravan is Preparing for Journey
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Our master artisans from Multan, Namak Mandi, and Hunza are staging their workshops.
            Approved demo products will populate once database query approval is confirmed.
          </p>
          <Link href="/sell">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
              Learn About Selling on Kaaravan
            </Button>
          </Link>
        </div>
      )}

      {/* 5. RECENTLY VIEWED (Client Local Storage) */}
      <RecentlyViewed allProducts={productCards} />
    </div>
  );
}
