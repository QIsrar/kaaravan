import React from "react";
import type { Metadata } from "next";
import { getCartAction } from "@/lib/actions/cart";
import { CheckoutView } from "@/components/store/checkout-view";
import { PatternDivider } from "@/components/store/pattern-divider";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Checkout — Kaaravan Marketplace",
  description: "Secure Pakistani address checkout and shipping breakdown.",
};

export default async function CheckoutPage() {
  const cart = await getCartAction();

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Secure Platform Checkout
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
          Kaaravan Delivery &amp; Payment
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Safe and verified shipping across all provinces of Pakistan
        </p>
      </div>

      <CheckoutView cart={cart} />

      <PatternDivider variant="tilework" className="py-4" />
    </div>
  );
}
