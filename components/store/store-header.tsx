"use client";

import Link from "next/link";
import { ShoppingBag, Compass, Store, Shield } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";
import { useCartStore } from "@/lib/store/cart-store";
import { Badge } from "@/components/ui/badge";

export function StoreHeader() {
  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background shadow-xs">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
            <Compass className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl font-bold tracking-tight text-primary">
              {BRAND_CONFIG.name}
            </span>
            <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:inline">
              {BRAND_CONFIG.tagline}
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/styleguide"
            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <span>Style Guide</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent text-accent">
              Phase 1
            </Badge>
          </Link>
          <Link
            href="/seller"
            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Store className="w-4 h-4" />
            <span>Seller Portal</span>
          </Link>
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </Link>
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            Account
          </Link>
          <button
            type="button"
            className="relative p-2 rounded-xl border border-border/80 hover:bg-muted text-foreground transition-all"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 text-primary" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-accent-foreground text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
