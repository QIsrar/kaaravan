"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Image } from "@/components/ui/image";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingBag,
  Check,
  ChevronRight,
  Store,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatPaisa, calculateDiscountPercent } from "@/lib/format/currency";
import { formatVariantLabel } from "@/lib/format/variant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAddToCartMutation } from "@/lib/hooks/use-cart";
import { showAddedToCartToast } from "@/components/store/added-to-cart-toast";
import { PAKISTAN_CITIES } from "@/lib/validators/checkout";
import { WishlistButton } from "@/components/store/wishlist-button";
import { useCurrentSeller } from "@/lib/hooks/use-current-seller";
import { getPublicImageUrl } from "@/lib/format/image-url";

export interface DetailVariant {
  id: string;
  sku: string;
  attributes: Record<string, string | number>;
  priceMinor: number;
  compareAtMinor: number | null;
  stockQuantity: number;
  reservedQuantity: number;
}

export interface DetailImage {
  path: string;
  sortOrder: number;
}

export interface DetailSeller {
  id: string;
  businessName: string;
  slug: string;
  logo: string | null;
  description: string | null;
  ratingAvg: number;
  returnWindowDays: number;
}

export interface DetailReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  authorName: string;
}

interface ProductDetailViewProps {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  categoryName: string;
  categorySlug: string;
  brandName?: string | null;
  ratingAvg: number;
  ratingCount: number;
  variants: DetailVariant[];
  images: DetailImage[];
  seller: DetailSeller;
  reviews?: DetailReview[];
}

// Delivery estimates by Pakistani city
const CITY_DELIVERY_DAYS: Record<string, string> = {
  Karachi: "1–2 business days (Standard Courier)",
  Lahore: "1–2 business days (Standard Courier)",
  Islamabad: "2–3 business days (Standard Courier)",
  Rawalpindi: "2–3 business days (Standard Courier)",
  Faisalabad: "2–3 business days (Standard Courier)",
  Multan: "1–2 business days (Local Guild Dispatch)",
  Peshawar: "1–2 business days (Local Guild Dispatch)",
  Quetta: "3–4 business days (Standard Courier)",
  Gilgit: "4–5 business days (Northern Valleys Route)",
  Skardu: "4–5 business days (Northern Valleys Route)",
};

export function ProductDetailView({
  id,
  title,
  slug,
  description,
  categoryName,
  categorySlug,
  brandName,
  ratingAvg,
  ratingCount,
  variants,
  images,
  seller,
  reviews = [],
}: ProductDetailViewProps) {
  const t = useTranslations("store");
  const tNav = useTranslations("nav");
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedCity, setSelectedCity] = useState("Lahore");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isAdded, setIsAdded] = useState(false);
  const addToCart = useAddToCartMutation();
  const isAdding = addToCart.isPending;

  const { data: currentSeller } = useCurrentSeller();
  const isOwnProduct = Boolean(currentSeller && currentSeller.id === seller.id);

  const currentVariant = variants[selectedVariantIndex] || variants[0];
  const galleryImages = images.length > 0 ? images : [{ path: "/placeholder-product.svg", sortOrder: 1 }];
  const activeImage = galleryImages[activeImageIndex] || galleryImages[0];

  const availableStock = currentVariant
    ? Math.max(0, currentVariant.stockQuantity - currentVariant.reservedQuantity)
    : 0;

  const discountPercent = currentVariant
    ? calculateDiscountPercent(currentVariant.priceMinor, currentVariant.compareAtMinor)
    : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddToCart = () => {
    if (!currentVariant || availableStock <= 0 || isOwnProduct) return;

    // Cart badge and totals update instantly (optimistic); this button's own
    // "Added" state and the toast wait for server success.
    addToCart.mutate(
      {
        variantId: currentVariant.id,
        quantity,
        optimistic: {
          productId: id,
          variantId: currentVariant.id,
          sellerId: seller.id,
          sellerName: seller.businessName,
          sellerSlug: seller.slug,
          productTitle: title,
          productSlug: slug,
          sku: currentVariant.sku,
          image: getPublicImageUrl(activeImage.path),
          priceMinor: currentVariant.priceMinor,
          compareAtMinor: currentVariant.compareAtMinor,
          quantity,
          stockAvailable: availableStock,
        },
      },
      {
        onSuccess: () => {
          setIsAdded(true);
          setTimeout(() => setIsAdded(false), 2000);
          showAddedToCartToast({
            image: getPublicImageUrl(activeImage.path),
            title,
            variantLabel: formatVariantLabel(currentVariant.attributes, currentVariant.sku),
            quantity,
            priceMinor: currentVariant.priceMinor,
          });
        },
      }
    );
  };

  return (
    <div className="space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">
          {tNav("home")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <Link href={`/category/${categorySlug}`} className="hover:text-primary transition-colors">
          <bdi dir="auto">{categoryName}</bdi>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <span className="text-foreground font-semibold line-clamp-1">
          <bdi dir="auto">{title}</bdi>
        </span>
      </nav>

      {/* Main Grid: Gallery on start, Details on end */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery with Zoom */}
        <div className="lg:col-span-6 space-y-4">
          <div
            className="relative aspect-square w-full rounded-3xl overflow-hidden bg-card border border-border shadow-sm cursor-crosshair"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <Image
              src={getPublicImageUrl(activeImage.path)}
              alt={title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={`object-cover object-center transition-transform duration-200 ${
                isZoomed ? "scale-150" : "scale-100"
              }`}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    }
                  : undefined
              }
            />

            {discountPercent && discountPercent > 0 && (
              <Badge
                variant="accent"
                className="absolute top-4 start-4 text-xs font-bold uppercase shadow-sm"
              >
                {discountPercent}% OFF
              </Badge>
            )}

            <div className="absolute bottom-3 end-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-xs text-[11px] font-medium text-muted-foreground border border-border">
              Hover to Zoom
            </div>
          </div>

          {/* Thumbnail strip */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-muted ${
                    idx === activeImageIndex
                      ? "border-primary ring-2 ring-primary/20 scale-105"
                      : "border-border hover:border-muted-foreground/60 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={getPublicImageUrl(img.path)}
                    alt={`${title} view ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Title, Variant Selector, Pricing, Delivery, Add to Cart */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            {brandName && (
              <span className="text-xs uppercase tracking-wider font-bold text-accent mb-1 block">
                {brandName}
              </span>
            )}
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
              <bdi dir="auto">{title}</bdi>
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-3 mt-2.5">
              {ratingCount > 0 ? (
                <>
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(ratingAvg) ? "fill-current" : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {ratingAvg.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({ratingCount} {t("verifiedReviews")})
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t("noReviewsYet")}
                </span>
              )}
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-baseline gap-3">
            <span className="font-heading text-3xl font-black text-primary">
              {formatPaisa(currentVariant?.priceMinor)}
            </span>
            {currentVariant?.compareAtMinor && currentVariant.compareAtMinor > currentVariant.priceMinor && (
              <span className="text-sm text-muted-foreground line-through font-mono">
                {formatPaisa(currentVariant.compareAtMinor)}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground ms-auto">
              Price includes all platform taxes
            </span>
          </div>

          {/* Variant Selector */}
          {variants.length > 1 && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Select Option / Variant:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {variants.map((v, idx) => {
                  const isSelected = idx === selectedVariantIndex;
                  const label =
                    Object.values(v.attributes).join(" · ") || v.sku;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantIndex(idx)}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-center ${
                        isSelected
                          ? "bg-primary/5 border-primary ring-1 ring-primary shadow-sm"
                          : "bg-card border-border hover:bg-muted"
                      }`}
                    >
                      <span className={`font-semibold text-sm line-clamp-2 ${isSelected ? "text-primary" : "text-foreground"}`}>
                        <bdi dir="auto">{label}</bdi>
                      </span>
                      <span className="text-xs mt-1 text-muted-foreground font-mono">
                        {formatPaisa(v.priceMinor)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock Availability */}
          <div className="flex items-center gap-2 text-xs">
            {availableStock > 0 ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {availableStock > 5
                    ? "In Stock — Ready for Kaaravan Dispatch"
                    : `Only ${availableStock} items remaining in artisan workshop`}
                </span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <span className="font-semibold text-destructive">
                  Out of Stock
                </span>
              </>
            )}
          </div>

          {/* Quantity Selector + Add to Cart Button (hidden on seller's own product) */}
          {isOwnProduct ? (
            <div className="p-3.5 rounded-2xl border border-secondary/40 bg-secondary/10 flex items-center gap-2.5 text-xs text-foreground font-semibold">
              <Store className="w-4 h-4 text-primary shrink-0" />
              <span>{t("yourProductBadge")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center rounded-xl border border-border bg-card p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted font-bold text-sm"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm text-foreground">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted font-bold text-sm"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={isAdding || availableStock <= 0}
                className={`flex-1 rounded-xl h-11 text-sm font-bold shadow-md transition-all ${
                  isAdded
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-accent text-accent-foreground hover:bg-accent/90"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span className="ms-2">{t("added")}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span className="ms-2">{t("addToCart")}</span>
                  </>
                )}
              </Button>

              <WishlistButton
                variantId={currentVariant.id}
                className="h-11 w-11 rounded-xl border border-border bg-card shrink-0 hover:bg-muted"
                iconClassName="w-5 h-5"
              />
            </div>
          )}

          {/* Delivery Estimation by Pakistani City */}
          <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-foreground">
                  Delivery Route &amp; Timings
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                Standard Shipping: PKR 250
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="city-select" className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span>{t("yourCity")}</span>
              </label>
              <select
                id="city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="text-xs rounded-xl border border-border bg-background p-2 text-foreground focus:ring-1 focus:ring-primary outline-none flex-1"
              >
                {PAKISTAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-foreground bg-primary/5 p-2 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                Estimated arrival:{" "}
                <strong>
                  {CITY_DELIVERY_DAYS[selectedCity] || "2–3 business days"}
                </strong>
              </span>
            </div>
          </div>

          {/* Verified Seller Workshop Card */}
          <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center relative overflow-hidden border border-border/60 shrink-0">
                {seller.logo ? (
                  <Image
                    src={getPublicImageUrl(seller.logo)}
                    alt={seller.businessName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <Store className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-bold text-sm text-foreground">
                    <bdi dir="auto">{seller.businessName}</bdi>
                  </span>
                  <span title={t("verifiedMerchant")}>
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>Rating: {seller.ratingAvg.toFixed(1)} ★</span>
                  <span>&bull;</span>
                  <span>{t("returnDays", { count: seller.returnWindowDays })}</span>
                </div>
              </div>
            </div>

            <Link href={`/store/${seller.slug}`}>
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
                <span>{t("visitStore")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Product Description & Provenance Details */}
      <section className="p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-2xs space-y-4">
        <h3 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{t("craftsmanshipDetails")}</span>
        </h3>
        <p dir="auto" className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
          {description || "Authentic Pakistani handicraft created by generational artisans using traditional tools, regional raw materials, and time-honoured techniques."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs font-bold text-foreground">{t("authenticityAssured")}</p>
              <p className="text-[11px] text-muted-foreground">{t("certifiedGuildCraft")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs font-bold text-foreground">{t("returnDays", { count: seller.returnWindowDays })}</p>
              <p className="text-[11px] text-muted-foreground">{t("damageTransitRefund")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs font-bold text-foreground">{t("safePackaging")}</p>
              <p className="text-[11px] text-muted-foreground">{t("transitHardenedBoxing")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground">
              {t("customerReviews")}
            </h3>
            {ratingCount > 0 ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(ratingAvg) ? "fill-current" : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">
                  {ratingAvg.toFixed(1)} out of 5
                </span>
                <span className="text-xs text-muted-foreground">
                  ({ratingCount} {t("verifiedReviews")})
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {t("noReviewsYet")}
              </p>
            )}
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-4 divide-y divide-border">
            {reviews.map((rev) => (
              <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">
                    <bdi dir="auto">{rev.authorName}</bdi>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(rev.createdAt).toLocaleDateString("en-PK")}
                  </span>
                </div>
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < rev.rating ? "fill-current" : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
                {rev.title && (
                  <h4 className="font-heading font-semibold text-sm text-foreground">
                    <bdi dir="auto">{rev.title}</bdi>
                  </h4>
                )}
                <p dir="auto" className="text-xs text-muted-foreground leading-relaxed">
                  {rev.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-muted/30 border border-dashed border-border text-xs text-muted-foreground">
            {t("noReviewsYet")}
          </div>
        )}
      </section>
    </div>
  );
}
