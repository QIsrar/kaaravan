"use client";

import React, { useEffect, useState } from "react";
import { ProductCard, type ProductCardProps } from "./product-card";
import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";

interface RecentlyViewedProps {
  allProducts: ProductCardProps[];
}

export function RecentlyViewed({ allProducts }: RecentlyViewedProps) {
  const t = useTranslations("store");
  const [recentItems, setRecentItems] = useState<ProductCardProps[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("kaaravan_recently_viewed");
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        const matched = ids
          .map((id) => allProducts.find((p) => p.id === id))
          .filter((p): p is ProductCardProps => Boolean(p))
          .slice(0, 4);
        setRecentItems(matched);
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, [allProducts]);

  if (!mounted || recentItems.length === 0) {
    return null;
  }

  return (
    <section className="my-14">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Eye className="w-4 h-4" />
        </div>
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
          {t("recentlyViewed")}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recentItems.map((item) => (
          <ProductCard key={item.id} {...item} />
        ))}
      </div>
    </section>
  );
}
