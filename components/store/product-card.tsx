"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Image } from "@/components/ui/image";
import { useTranslations } from "next-intl";
import { Star, ShoppingBag, Check } from "lucide-react";
import { formatPaisa, calculateDiscountPercent } from "@/lib/format/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAddToCartMutation } from "@/lib/hooks/use-cart";
import { showAddedToCartToast } from "@/components/store/added-to-cart-toast";
import { WishlistButton } from "@/components/store/wishlist-button";
import { useCurrentSeller } from "@/lib/hooks/use-current-seller";
import { getPublicImageUrl } from "@/lib/format/image-url";

export interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  image: string;
  sellerId: string;
  sellerName: string;
  sellerSlug: string;
  priceMinor: number;
  compareAtMinor?: number | null;
  ratingAvg?: number;
  ratingCount?: number;
  primaryVariantId: string;
  primaryVariantLabel: string;
}

export function ProductCard({
  id,
  title,
  slug,
  image,
  sellerId,
  sellerSlug,
  sellerName,
  priceMinor,
  compareAtMinor,
  ratingAvg = 0,
  ratingCount = 0,
  primaryVariantId,
  primaryVariantLabel,
}: ProductCardProps) {
  const t = useTranslations("store");
  const [isAdded, setIsAdded] = useState(false);
  const addToCart = useAddToCartMutation();
  const isAdding = addToCart.isPending;

  const { data: currentSeller } = useCurrentSeller();
  const isOwnProduct = Boolean(currentSeller && currentSeller.id === sellerId);

  const discountPercent = calculateDiscountPercent(priceMinor, compareAtMinor);

  const recordRecentlyViewed = () => {
    try {
      const stored = localStorage.getItem("kaaravan_recently_viewed");
      const list: string[] = stored ? JSON.parse(stored) : [];
      const updated = [id, ...list.filter((x) => x !== id)].slice(0, 10);
      localStorage.setItem("kaaravan_recently_viewed", JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding || isAdded || isOwnProduct) return;

    try {
      await addToCart.mutateAsync({
        variantId: primaryVariantId,
        quantity: 1,
        optimistic: {
          productId: id,
          variantId: primaryVariantId,
          sellerId,
          sellerName,
          sellerSlug,
          productTitle: title,
          productSlug: slug,
          sku: primaryVariantLabel,
          image,
          priceMinor,
          compareAtMinor: compareAtMinor ?? null,
          quantity: 1,
          stockAvailable: 99,
        },
      });

      setIsAdded(true);
      showAddedToCartToast({
        title,
        priceMinor,
        image,
        variantLabel: primaryVariantLabel,
        quantity: 1,
      });

      setTimeout(() => {
        setIsAdded(false);
      }, 2500);
    } catch {
      // Error is caught and toasted by useAddToCartMutation
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Product Image & Badges */}
      <Link
        href={`/product/${slug}`}
        onClick={recordRecentlyViewed}
        className="relative block aspect-square w-full overflow-hidden bg-muted/40"
      >
        <Image
          src={getPublicImageUrl(image)}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Discount Badge */}
        {discountPercent && discountPercent > 0 && (
          <Badge
            variant="accent"
            className="absolute top-3 start-3 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 shadow-xs"
          >
            {discountPercent}% OFF
          </Badge>
        )}

        {/* Wishlist Button (hidden on seller's own product) */}
        {!isOwnProduct && (
          <div className="absolute top-3 end-3 z-10">
            <WishlistButton variantId={primaryVariantId} />
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Seller Attribution */}
          <Link
            href={`/store/${sellerSlug}`}
            className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors block mb-1 truncate"
          >
            {t.rich("byArtisan", {
              seller: sellerName,
              artisan: (chunks) => (
                <bdi dir="auto" className="underline decoration-dotted underline-offset-2">
                  {chunks}
                </bdi>
              ),
            })}
          </Link>

          {/* Product Title */}
          <Link
            href={`/product/${slug}`}
            onClick={recordRecentlyViewed}
            className="font-heading font-semibold text-sm text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug"
          >
            <bdi dir="auto">{title}</bdi>
          </Link>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50">
          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2 min-h-[1.25rem]">
            {ratingCount > 0 ? (
              <>
                <div className="flex items-center text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {ratingAvg.toFixed(1)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  ({ratingCount})
                </span>
              </>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                {t("noReviewsYet")}
              </span>
            )}
          </div>

          {/* Price & Action Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-base text-foreground">
                {formatPaisa(priceMinor)}
              </span>
              {compareAtMinor && compareAtMinor > priceMinor && (
                <span className="text-xs text-muted-foreground line-through -mt-1 font-mono">
                  {formatPaisa(compareAtMinor)}
                </span>
              )}
            </div>

            {!isOwnProduct && (
              <Button
                size="sm"
                onClick={handleQuickAdd}
                disabled={isAdding}
                className={
                  isAdded
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 px-2.5 transition-colors"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-8 px-2.5"
                }
                aria-label={`${t("addToCart")}: ${title}`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="text-xs font-bold ms-1 hidden sm:inline">{t("addedShort")}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold ms-1 hidden sm:inline">{t("addShort")}</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
