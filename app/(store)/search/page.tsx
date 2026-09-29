import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard, type ProductCardProps } from "@/components/store/product-card";
import { PatternDivider } from "@/components/store/pattern-divider";
import { searchProducts } from "@/lib/services/search";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const term = q ? `"${q}"` : "Explore Crafts";
  return {
    title: `Search: ${term} — Kaaravan Marketplace`,
    description: `Search results for ${term} across authentic Pakistani artisans and workshops.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();

  const { query: trimmed, products: searchResults } = await searchProducts(supabase, q, 40, 0);
  const products: ProductCardProps[] = searchResults;
  let didYouMean: string | null = null;

  if (trimmed.length > 0) {
    // Fuzzy "Did You Mean" calculation if no results or few results
    if (products.length === 0) {
      const suggestions = [
        "Peshawari Chappal",
        "Blue Pottery",
        "Pashmina Shawl",
        "Honey",
        "Sheesham",
        "Ajrak",
        "Copper Degchi",
        "Khaddar",
      ];
      const match = suggestions.find(
        (s) =>
          s.toLowerCase().includes(trimmed.toLowerCase()) ||
          trimmed.toLowerCase().includes(s.toLowerCase()) ||
          (trimmed.length > 3 && s.toLowerCase().startsWith(trimmed.substring(0, 3).toLowerCase()))
      );
      if (match && match.toLowerCase() !== trimmed.toLowerCase()) {
        didYouMean = match;
      }
    }
  }

  // 3. Categories for no-results or empty search discovery
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .is("deleted_at", null)
    .limit(6);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Search Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Marketplace Search
          </span>
        </div>

        <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {trimmed ? (
            <>
              Results for <span className="text-primary">&ldquo;{trimmed}&rdquo;</span>
            </>
          ) : (
            "Explore All Crafts"
          )}
        </h1>

        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "craft" : "crafts"} found along the Kaaravan trail
        </p>

        {/* "Did you mean" suggestion */}
        {didYouMean && (
          <div className="mt-4 p-3 rounded-2xl bg-secondary/15 border border-secondary/30 inline-flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-foreground">Did you mean:</span>
            <Link
              href={`/search?q=${encodeURIComponent(didYouMean)}`}
              className="text-primary font-bold underline hover:text-accent"
            >
              {didYouMean}
            </Link>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((item) => (
            <ProductCard key={item.id} {...item} />
          ))}
        </div>
      ) : (
        /* No-Results State */
        <div className="p-8 sm:p-14 rounded-3xl border border-dashed border-border bg-card/60 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto text-3xl">
            🧭
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            No artisan crafts found for &ldquo;{trimmed}&rdquo;
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Check the spelling, try broader keywords (e.g. &ldquo;shawl&rdquo;, &ldquo;pottery&rdquo;, &ldquo;leather&rdquo;),
            or discover popular traditional categories:
          </p>

          {categories && categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-card hover:bg-primary hover:text-primary-foreground border border-border text-foreground transition-colors shadow-2xs font-medium"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
            >
              <span>Return to Kaaravan Home</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      )}

      <PatternDivider variant="tilework" className="py-4" />
    </div>
  );
}
