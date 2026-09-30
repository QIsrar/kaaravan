"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2, ShoppingBag, Check } from "lucide-react";
import { removeFromWishlistAction } from "@/lib/actions/customer_accounts";
import { useAddToCartMutation } from "@/lib/hooks/use-cart";
import { showAddedToCartToast } from "@/components/store/added-to-cart-toast";
import { WISHLIST_QUERY_KEY } from "@/lib/hooks/use-wishlist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image } from "@/components/ui/image";
import { Card } from "@/components/ui/card";
import { formatPaisa } from "@/lib/format/currency";

interface WishlistVariant {
  id: string;
  sku: string;
  price_minor: number | string;
  compare_at_minor?: number | string | null;
  stock_quantity?: number | null;
  reserved_quantity?: number | null;
  attributes?: Record<string, string | number> | null;
  products?: {
    id?: string;
    title: string;
    slug: string;
    product_images?: { path: string }[] | null;
  } | null;
}

export interface WishlistItem {
  id: string;
  profile_id: string;
  variant_id: string;
  created_at: string;
  product_variants?: WishlistVariant | null;
}

interface WishlistManagerProps {
  initialItems: WishlistItem[];
}

export function WishlistManager({ initialItems }: WishlistManagerProps) {
  const t = useTranslations("wishlist");
  const queryClient = useQueryClient();
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [addedVariantIds, setAddedVariantIds] = useState<Record<string, boolean>>({});
  const [removingIds, setRemovingIds] = useState<Record<string, boolean>>({});

  const addToCart = useAddToCartMutation();

  const handleRemove = async (variantId: string) => {
    setRemovingIds((prev) => ({ ...prev, [variantId]: true }));

    try {
      await removeFromWishlistAction(variantId);
      setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
      queryClient.setQueryData<string[]>(WISHLIST_QUERY_KEY, (prev = []) =>
        prev.filter((id) => id !== variantId)
      );
      toast.info(t("removedSuccess"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not remove item.");
    } finally {
      setRemovingIds((prev) => ({ ...prev, [variantId]: false }));
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    const variant = item.product_variants;
    if (!variant || !variant.products) return;

    const availableStock = Math.max(
      0,
      (variant.stock_quantity ?? 0) - (variant.reserved_quantity ?? 0)
    );
    if (availableStock <= 0) {
      toast.error(t("outOfStock"));
      return;
    }

    const imagePath = variant.products.product_images?.[0]?.path || "/placeholder-product.svg";

    addToCart.mutate(
      {
        variantId: item.variant_id,
        quantity: 1,
        optimistic: {
          productId: variant.products.id || "",
          variantId: item.variant_id,
          sellerId: "",
          sellerName: "Artisan Merchant",
          sellerSlug: "",
          productTitle: variant.products.title,
          productSlug: variant.products.slug,
          sku: variant.sku,
          image: imagePath,
          priceMinor: Number(variant.price_minor),
          compareAtMinor: variant.compare_at_minor ? Number(variant.compare_at_minor) : null,
          quantity: 1,
          stockAvailable: availableStock,
        },
      },
      {
        onSuccess: () => {
          setAddedVariantIds((prev) => ({ ...prev, [item.variant_id]: true }));
          setTimeout(() => {
            setAddedVariantIds((prev) => ({ ...prev, [item.variant_id]: false }));
          }, 1800);

          showAddedToCartToast({
            image: imagePath,
            title: variant.products?.title || "Craft Item",
            variantLabel: variant.sku || "Standard",
            quantity: 1,
            priceMinor: Number(variant.price_minor),
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="p-10 sm:p-16 text-center rounded-3xl border border-dashed border-border bg-card/60 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-heading font-bold text-base text-foreground">
              {t("emptyTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("emptyDesc")}
            </p>
          </div>
          <Link href="/" className="inline-block pt-2">
            <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold">
              {t("exploreBazaar")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {items.map((item) => {
            const variant = item.product_variants;
            const product = variant?.products;
            if (!variant || !product) return null;

            const imagePath = product.product_images?.[0]?.path || "/placeholder-product.svg";
            const availableStock = Math.max(
              0,
              (variant.stock_quantity ?? 0) - (variant.reserved_quantity ?? 0)
            );
            const inStock = availableStock > 0;
            const isAdded = Boolean(addedVariantIds[item.variant_id]);
            const isRemoving = Boolean(removingIds[item.variant_id]);

            return (
              <Card
                key={item.id}
                className="rounded-3xl border-border bg-card shadow-2xs hover:border-primary/40 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image Frame */}
                  <div className="relative aspect-square w-full bg-muted/40 border-b border-border/60 overflow-hidden">
                    <Link href={`/product/${product.slug}`}>
                      <Image
                        src={imagePath}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    {/* Remove Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(item.variant_id)}
                      disabled={isRemoving}
                      aria-label="Remove item from wishlist"
                      className="absolute top-3 end-3 p-2 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-destructive shadow-xs backdrop-blur-xs transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2">
                    <Link
                      href={`/product/${product.slug}`}
                      className="font-heading font-semibold text-sm text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug"
                    >
                      {product.title}
                    </Link>

                    {variant.attributes && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {Object.entries(variant.attributes)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div>
                        <span className="font-heading font-extrabold text-base text-foreground">
                          {formatPaisa(Number(variant.price_minor))}
                        </span>
                        {variant.compare_at_minor &&
                          Number(variant.compare_at_minor) > Number(variant.price_minor) && (
                            <span className="text-xs text-muted-foreground line-through ms-2 font-mono">
                              {formatPaisa(Number(variant.compare_at_minor))}
                            </span>
                          )}
                      </div>

                      <Badge
                        variant={inStock ? "outline" : "destructive"}
                        className="text-[10px] uppercase font-bold py-0"
                      >
                        {inStock ? t("inStock") : t("outOfStock")}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Add to Kart Button */}
                <div className="p-4 pt-0">
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(item)}
                    disabled={!inStock || addToCart.isPending}
                    className={`w-full rounded-xl text-xs font-semibold h-9 transition-all ${
                      isAdded
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="ms-1.5">{t("addedToKart")}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span className="ms-1.5">{t("addToKart")}</span>
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
