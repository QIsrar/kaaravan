"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StoreCategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface StoreCatalogFiltersProps {
  categories: StoreCategoryOption[];
  currentCategory?: string;
  currentSort?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  currentSearch?: string;
}

export function StoreCatalogFilters({
  categories,
  currentCategory = "",
  currentSort = "newest",
  currentMinPrice = "",
  currentMaxPrice = "",
  currentSearch = "",
}: StoreCatalogFiltersProps) {
  const t = useTranslations("store");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim().length > 0) {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const parsedMin = minPrice ? Math.max(0, parseInt(minPrice, 10)) : null;
    const parsedMax = maxPrice ? Math.max(0, parseInt(maxPrice, 10)) : null;

    if (parsedMin !== null && !isNaN(parsedMin)) {
      if (parsedMax !== null && !isNaN(parsedMax) && parsedMin > parsedMax) {
        params.set("minPrice", String(parsedMax));
        params.set("maxPrice", String(parsedMin));
        setMinPrice(String(parsedMax));
        setMaxPrice(String(parsedMin));
      } else {
        params.set("minPrice", String(parsedMin));
        if (parsedMax !== null && !isNaN(parsedMax)) {
          params.set("maxPrice", String(parsedMax));
        } else {
          params.delete("maxPrice");
        }
      }
    } else {
      params.delete("minPrice");
      if (parsedMax !== null && !isNaN(parsedMax)) {
        params.set("maxPrice", String(parsedMax));
      } else {
        params.delete("maxPrice");
      }
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("q", search);
  };

  const handleReset = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(
    currentCategory || currentMinPrice || currentMaxPrice || currentSearch || (currentSort && currentSort !== "newest")
  );

  return (
    <aside className="w-full lg:w-64 shrink-0 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-bold text-sm text-foreground">
            {t("filters")}
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t("reset")}</span>
          </button>
        )}
      </div>

      {/* Search within this store */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
          {t("search")}
        </label>
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder={t("searchCraftPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-xl border border-border bg-muted/30 p-2 ps-8 text-foreground focus:ring-1 focus:ring-primary outline-none"
          />
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      {/* Sort By */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
          {t("sortBy")}
        </label>
        <select
          value={currentSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="w-full text-xs rounded-xl border border-border bg-card p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="newest">{t("newestMasterworks")}</option>
          <option value="price_asc">{t("priceLowHigh")}</option>
          <option value="price_desc">{t("priceHighLow")}</option>
          <option value="rating_desc">{t("highestRated")}</option>
        </select>
      </div>

      {/* Category filter within store */}
      {categories.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
            {t("categories")}
          </label>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => updateParam("category", "")}
              className={`w-full text-start text-xs py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between ${
                !currentCategory ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>{t("allDisciplines")}</span>
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => updateParam("category", c.slug)}
                className={`w-full text-start text-xs py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between ${
                  currentCategory === c.slug ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span><bdi dir="auto">{c.name}</bdi></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range Filter (PKR) */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
          {t("priceRange")}
        </label>
        <form onSubmit={handlePriceApply} className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="100"
              placeholder={t("minPricePlaceholder")}
              value={minPrice}
              onChange={(e) => {
                const val = e.target.value;
                if (!val || Number(val) >= 0) {
                  setMinPrice(val.replace(/[^0-9]/g, ""));
                }
              }}
              className="w-full text-xs rounded-xl border border-border bg-card p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <input
              type="number"
              min="0"
              step="100"
              placeholder={t("maxPricePlaceholder")}
              value={maxPrice}
              onChange={(e) => {
                const val = e.target.value;
                if (!val || Number(val) >= 0) {
                  setMaxPrice(val.replace(/[^0-9]/g, ""));
                }
              }}
              className="w-full text-xs rounded-xl border border-border bg-card p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <Button type="submit" size="xs" variant="outline" className="w-full text-xs font-medium">
            {t("applyFilters")}
          </Button>
        </form>
      </div>
    </aside>
  );
}
