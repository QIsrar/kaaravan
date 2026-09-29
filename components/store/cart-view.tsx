"use client";

import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Store, ArrowRight, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { formatPaisa } from "@/lib/format/currency";
import { Button } from "@/components/ui/button";
import type { CartDetails } from "@/lib/services/cart";
import { updateCartItemAction, removeFromCartAction, clearCartAction } from "@/lib/actions/cart";
import { CART_QUERY_KEY } from "@/lib/hooks/use-cart";

interface CartViewProps {
  initialCart: CartDetails | null;
}

export function CartView({ initialCart }: CartViewProps) {
  const [cart, setCart] = useState<CartDetails | null>(initialCart);
  const [loadingVariantId, setLoadingVariantId] = useState<string | null>(null);
  const [stockNotice, setStockNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleUpdateQty = async (variantId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    setLoadingVariantId(variantId);
    setStockNotice(null);

    try {
      const res = await updateCartItemAction({ variantId, quantity: newQty });
      if (res.cartDetails) {
        setCart(res.cartDetails);
      }
      if (res.message) {
        setStockNotice(res.message);
      }
      await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update quantity";
      setStockNotice(msg);
    } finally {
      setLoadingVariantId(null);
    }
  };

  const handleRemoveItem = async (variantId: string) => {
    setLoadingVariantId(variantId);
    try {
      const res = await removeFromCartAction({ variantId });
      if (res.cartDetails) {
        setCart(res.cartDetails);
      }
      await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove item";
      toast.error(msg);
    } finally {
      setLoadingVariantId(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm("Are you sure you want to clear your caravan cart?")) return;
    try {
      await clearCartAction();
      setCart(null);
      await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to clear cart";
      toast.error(msg);
    }
  };

  if (!cart || cart.totalItems === 0 || cart.sellerGroups.length === 0) {
    return (
      <div className="p-8 sm:p-16 rounded-3xl border border-dashed border-border bg-card text-center max-w-xl mx-auto space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-4xl shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Your Kaaravan Kart is Empty
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            You haven&apos;t joined any handcrafted pieces from Pakistan&apos;s master artisans to your Kaaravan yet.
          </p>
        </div>

        <Link href="/">
          <Button size="lg" className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 shadow-md">
            <span>Explore Artisans</span>
            <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Items list grouped by seller */}
      <div className="lg:col-span-8 space-y-6">
        {cart.hasUnavailableItems && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-destructive" />
            <span>
              Some items in your cart are currently out of stock or unavailable. They have been excluded from your order summary totals.
            </span>
          </div>
        )}

        {stockNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{stockNotice}</span>
          </div>
        )}

        {cart.sellerGroups.map((group) => (
          <div
            key={group.sellerId}
            className="rounded-3xl border border-border bg-card shadow-2xs overflow-hidden"
          >
            {/* Seller Header */}
            <div className="bg-muted/40 p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Sold by</span>
                <Link
                  href={`/store/${group.sellerSlug}`}
                  className="font-heading font-bold text-sm text-foreground hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
                >
                  {group.sellerName}
                </Link>
              </div>

              <span className="text-xs text-muted-foreground font-medium">
                Merchant Delivery: {formatPaisa(group.estimatedShippingMinor)}
              </span>
            </div>

            {/* Seller Items */}
            <div className="p-4 sm:p-6 divide-y divide-border/60">
              {group.items.map((item) => {
                const isLoading = loadingVariantId === item.variantId;

                return (
                  <div
                    key={item.cartItemId}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Thumbnail + Title */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-muted border border-border shrink-0">
                        <Image
                          src={item.image}
                          alt={item.productTitle}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      <div className="space-y-1">
                        <Link
                          href={`/product/${item.productSlug}`}
                          className="font-heading font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.productTitle}
                        </Link>

                        {/* Variant Attributes */}
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(item.attributes).map(([k, v]) => (
                            <span key={k} className="me-2 inline-block">
                              <span className="capitalize">{k}:</span> <strong>{v}</strong>
                            </span>
                          ))}
                        </div>

                        {/* Stock warning if low */}
                        {item.stockAvailable <= 3 && item.stockAvailable > 0 && (
                          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            Only {item.stockAvailable} left in artisan workshop
                          </p>
                        )}
                        {!item.isAvailable && (
                          <p className="text-[11px] font-semibold text-destructive">
                            Item out of stock
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-64">
                      {/* Quantity Stepper */}
                      <div className="flex items-center rounded-xl border border-border bg-background p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.variantId, item.quantity, -1)}
                          disabled={isLoading || item.quantity <= 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground hover:bg-muted font-bold text-xs disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-xs text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.variantId, item.quantity, 1)}
                          disabled={isLoading || item.quantity >= item.stockAvailable}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground hover:bg-muted font-bold text-xs disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="text-end min-w-24">
                        <span className="font-heading font-extrabold text-sm sm:text-base text-foreground block">
                          {formatPaisa(item.subtotalMinor)}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {formatPaisa(item.priceMinor)} each
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.variantId)}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={`Remove ${item.productTitle}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleClearCart}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
          >
            Clear Entire Cart
          </button>
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-4 sticky top-24">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h3 className="font-heading font-extrabold text-lg text-foreground border-b border-border pb-3">
            Kaaravan Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Items Total ({cart.totalItems})</span>
              <span className="font-mono text-foreground font-semibold">
                {formatPaisa(cart.subtotalMinor)}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Shipping ({cart.sellerGroups.length} {cart.sellerGroups.length === 1 ? "merchant" : "merchants"})</span>
              </div>
              <span className="font-mono text-foreground font-semibold">
                {formatPaisa(cart.shippingMinor)}
              </span>
            </div>

            <div className="pt-3 border-t border-border flex justify-between items-baseline">
              <span className="font-heading font-bold text-base text-foreground">
                Grand Total
              </span>
              <span className="font-heading font-black text-2xl text-primary">
                {formatPaisa(cart.grandTotalMinor)}
              </span>
            </div>
          </div>

          <Link href="/checkout" className="block">
            <Button
              size="lg"
              className="w-full h-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base shadow-md transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
            </Button>
          </Link>

          <div className="pt-2 text-[11px] text-muted-foreground space-y-2 border-t border-border/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Verified artisan sellers &amp; secure checkout</span>
            </div>
            <p className="leading-relaxed">
              Delivery is fulfilled by certified regional courier partners with real-time route milestone tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
