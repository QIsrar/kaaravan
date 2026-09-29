import React from "react";
import type { Metadata } from "next";
import { getCartAction } from "@/lib/actions/cart";
import { CartView } from "@/components/store/cart-view";
import { PatternDivider } from "@/components/store/pattern-divider";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Kaaravan Kart — Authentic Pakistani Marketplace",
  description: "Review your selected handcrafted items grouped by artisan workshop.",
};

export default async function CartPage() {
  const cart = await getCartAction();

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Marketplace Kart
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
          Your Kaaravan Kart
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Handcrafted crafts directly from artisan workshops across Pakistan
        </p>
      </div>

      <CartView initialCart={cart} />

      <PatternDivider variant="caravan-route" className="py-4" />
    </div>
  );
}
