"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, RotateCcw, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BrandFilterOption {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFiltersProps {
  brands: BrandFilterOption[];
  currentSort?: string;
  currentBrand?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  currentRating?: string;
}

export function CategoryFilters({
  brands,
  currentSort = "newest",
  currentBrand = "",
  currentMinPrice = "",
  currentMaxPrice = "",
  currentRating = "",
}: CategoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim().length > 0) {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset page on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const parsedMin = minPrice ? Math.max(0, parseInt(minPrice, 10)) : null;
    const parsedMax = maxPrice ? Math.max(0, parseInt(maxPrice, 10)) : null;

    if (parsedMin !== null && !isNaN(parsedMin)) {
      if (parsedMax !== null && !isNaN(parsedMax) && parsedMin > parsedMax) {
        // Enforce threshold: swap min and max so min <= max
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

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    setIsMobileDrawerOpen(false);
  };

  const handleClearAll = () => {
    setMinPrice("");
    setMaxPrice("");
    router.push(pathname);
    setIsMobileDrawerOpen(false);
  };

  const hasActiveFilters = Boolean(
    currentBrand || currentMinPrice || currentMaxPrice || currentRating || (currentSort && currentSort !== "newest")
  );

  const hasPriceValue = Boolean(minPrice || maxPrice);
  const priceUnchanged = minPrice === currentMinPrice && maxPrice === currentMaxPrice;
  const isPriceApplyDisabled = !hasPriceValue || priceUnchanged;

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Header / Clear */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-bold text-sm text-foreground">
            Filter Crafts
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Sort By */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
          Sort By
        </label>
        <select
          value={currentSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="w-full text-xs rounded-xl border border-border bg-card p-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating_desc">Highest Rated</option>
        </select>
      </div>

      {/* Price Range Filter (PKR) */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
          Price Range (PKR)
        </label>
        <form onSubmit={handlePriceApply} className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="100"
              placeholder="Min"
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
              placeholder="Max"
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
          <Button
            type="submit"
            size="xs"
            variant="outline"
            disabled={isPriceApplyDisabled}
            className="w-full text-xs font-medium"
          >
            Apply Price
          </Button>
        </form>
      </div>

      {/* Brands / Workshops */}
      {brands.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
            Artisan Workshop
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pe-1">
            <button
              type="button"
              onClick={() => updateParam("brand", "")}
              className={`w-full text-start text-xs py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between ${
                !currentBrand ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>All Workshops</span>
            </button>
            {brands.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => updateParam("brand", b.slug)}
                className={`w-full text-start text-xs py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between ${
                  currentBrand === b.slug ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Minimum Rating */}
      <div>
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
          Customer Rating
        </label>
        <div className="space-y-1.5">
          {[
            { val: "4.5", label: "4.5 Stars & Above" },
            { val: "4.0", label: "4.0 Stars & Above" },
            { val: "3.5", label: "3.5 Stars & Above" },
            { val: "", label: "All Ratings" },
          ].map((r) => (
            <button
              key={r.val}
              type="button"
              onClick={() => updateParam("minRating", r.val)}
              className={`w-full text-start text-xs py-1.5 px-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                currentRating === r.val ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {r.val && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Panel */}
      <aside className="hidden lg:block w-64 shrink-0 rounded-2xl border border-border bg-card p-5 shadow-2xs sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain">
        <FilterPanel />
      </aside>

      {/* Mobile Drawer Trigger */}
      <div className="lg:hidden flex items-center justify-between w-full mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="gap-2 rounded-xl text-xs font-medium"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters &amp; Sorting</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-accent" />
          )}
        </Button>

        <span className="text-xs text-muted-foreground">
          Sort: {currentSort.replace("_", " ")}
        </span>
      </div>

      {/* Mobile Drawer Modal */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs lg:hidden">
          <div className="w-4/5 max-w-sm bg-card p-6 h-full overflow-y-auto shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-heading font-bold text-base text-foreground">
                  Filters
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel />
            </div>

            <Button
              className="mt-6 w-full bg-primary text-primary-foreground rounded-xl"
              onClick={() => setIsMobileDrawerOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
