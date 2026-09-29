import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  ProductDetailView,
  type DetailVariant,
  type DetailImage,
  type DetailSeller,
  type DetailReview,
} from "@/components/store/product-detail-view";
import { ProductCard, type ProductCardProps } from "@/components/store/product-card";
import { PatternDivider } from "@/components/store/pattern-divider";
import { Sparkles } from "lucide-react";
import { formatVariantLabel } from "@/lib/format/variant";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

interface RawProductImage {
  path: string;
  sort_order: number | null;
}

interface RawProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string | number> | null;
  price_minor: number | string;
  compare_at_minor: number | string | null;
  stock_quantity: number | null;
  reserved_quantity: number | null;
  is_active: boolean;
}

interface RawProductSeller {
  id: string;
  business_name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  rating_avg: number | null;
  return_window_days: number | null;
  status: string;
}

interface RawCategoryRef {
  id: string;
  name: string;
  slug: string;
}

interface RawBrandRef {
  id: string;
  name: string;
  slug: string;
}

interface RawProductDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  category_id: string;
  category: RawCategoryRef | null;
  brand: RawBrandRef | null;
  seller: RawProductSeller | null;
  variants: RawProductVariant[] | null;
  images: RawProductImage[] | null;
}

interface RawReviewProfile {
  full_name: string | null;
}

interface RawProductReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  profile: RawReviewProfile | null;
}

interface RawRelatedProduct {
  id: string;
  title: string;
  slug: string;
  rating_avg: number | null;
  rating_count: number | null;
  seller: {
    id: string;
    business_name: string;
    slug: string;
  } | null;
  variants: {
    id: string;
    sku: string;
    attributes: unknown;
    price_minor: number | string;
    compare_at_minor: number | string | null;
    is_active: boolean;
  }[] | null;
  images: RawProductImage[] | null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(`
      title,
      description,
      images:product_images (
        path,
        sort_order
      )
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (!product) {
    return {
      title: "Handcrafted Item — Kaaravan Marketplace",
    };
  }

  const sortedImages = ((product.images as unknown as RawProductImage[]) || []).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  const primaryImage = sortedImages[0]?.path || "/placeholder-product.svg";

  return {
    title: `${product.title} — Kaaravan Marketplace`,
    description: product.description?.slice(0, 160) || "Handcrafted Pakistani craft on Kaaravan.",
    openGraph: {
      title: product.title,
      description: product.description?.slice(0, 160) || undefined,
      images: [{ url: primaryImage }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch main product details
  const { data: rawProduct } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      description,
      rating_avg,
      rating_count,
      category_id,
      category:categories (
        id,
        name,
        slug
      ),
      brand:brands (
        id,
        name,
        slug
      ),
      seller:sellers (
        id,
        business_name,
        slug,
        logo,
        description,
        rating_avg,
        return_window_days,
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
    .eq("slug", slug)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  const product = rawProduct as unknown as RawProductDetail | null;
  if (!product) {
    notFound();
  }

  const seller = product.seller;
  if (!seller || seller.status !== "approved") {
    notFound();
  }

  const category = product.category;
  const brand = product.brand;

  // Variants
  const variants: DetailVariant[] = (product.variants || [])
    .filter((v) => v.is_active)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      attributes: (v.attributes as Record<string, string | number>) || {},
      priceMinor: Number(v.price_minor),
      compareAtMinor: v.compare_at_minor ? Number(v.compare_at_minor) : null,
      stockQuantity: v.stock_quantity ?? 0,
      reservedQuantity: v.reserved_quantity ?? 0,
    }))
    .sort((a, b) => a.priceMinor - b.priceMinor);

  if (variants.length === 0) {
    notFound();
  }

  // Images
  const rawImages = (product.images || []).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  const images: DetailImage[] =
    rawImages.length > 0
      ? rawImages.map((i) => ({
          path: i.path,
          sortOrder: i.sort_order ?? 0,
        }))
      : [
          {
            path: "/placeholder-product.svg",
            sortOrder: 0,
          },
        ];

  const detailSeller: DetailSeller = {
    id: seller.id,
    businessName: seller.business_name,
    slug: seller.slug,
    logo: seller.logo,
    description: seller.description,
    ratingAvg: Number(seller.rating_avg) || 4.8,
    returnWindowDays: seller.return_window_days ?? 7,
  };

  // 2. Fetch published reviews
  const { data: rawReviews } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      title,
      body,
      created_at,
      profile:profiles (
        full_name
      )
    `)
    .eq("product_id", product.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);

  const reviews: DetailReview[] = ((rawReviews as unknown as RawProductReview[]) || []).map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
    authorName: r.profile?.full_name || "Verified Kaaravan Customer",
  }));

  // 3. Fetch Related Products from same category
  const { data: rawRelated } = await supabase
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
        is_active
      ),
      images:product_images (
        path,
        sort_order
      )
    `)
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .limit(4);

  const relatedProducts: ProductCardProps[] = [];
  for (const rel of (rawRelated as unknown as RawRelatedProduct[]) || []) {
    const s = rel.seller;
    if (!s) continue;
    const relVars = (rel.variants || []).filter((v) => v.is_active);
    if (relVars.length === 0) continue;
    const primaryRel = relVars[0];
    const relImgs = (rel.images || []).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    relatedProducts.push({
      id: rel.id,
      title: rel.title,
      slug: rel.slug,
      image: relImgs[0]?.path || "/placeholder-product.svg",
      sellerId: s.id,
      sellerName: s.business_name,
      sellerSlug: s.slug,
      priceMinor: Number(primaryRel.price_minor),
      compareAtMinor: primaryRel.compare_at_minor
        ? Number(primaryRel.compare_at_minor)
        : null,
      ratingAvg: Number(rel.rating_avg) || 4.8,
      ratingCount: Number(rel.rating_count) || 10,
      primaryVariantId: primaryRel.id,
      primaryVariantLabel: formatVariantLabel(
        primaryRel.attributes as Record<string, string | number> | null,
        primaryRel.sku
      ),
    });
  }

  // 4. JSON-LD Structured Data
  const primaryVariant = variants[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    image: images.map((i) => i.path),
    sku: primaryVariant.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: (primaryVariant.priceMinor / 100).toFixed(2),
      availability:
        primaryVariant.stockQuantity > primaryVariant.reservedQuantity
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: detailSeller.businessName,
      },
    },
    aggregateRating:
      (product.rating_count ?? 0) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating_avg,
            reviewCount: product.rating_count,
          }
        : undefined,
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 space-y-12">
      {/* JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main Interactive Product View */}
      <ProductDetailView
        id={product.id}
        title={product.title}
        slug={product.slug}
        description={product.description}
        categoryName={category?.name || "Crafts"}
        categorySlug={category?.slug || "apparel-textiles"}
        brandName={brand?.name}
        ratingAvg={Number(product.rating_avg) || 4.8}
        ratingCount={Number(product.rating_count) || 12}
        variants={variants}
        images={images}
        seller={detailSeller}
        reviews={reviews}
      />

      <PatternDivider variant="tilework" className="py-4" />

      {/* Related Products from the same Caravan */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
              More Handcrafted Treasures from this Kaaravan
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} {...item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
