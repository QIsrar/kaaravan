import Link from "next/link";
import { BRAND_CONFIG } from "@/config/brand";
import { PatternDivider } from "./pattern-divider";

export function StoreFooter() {
  return (
    <footer className="w-full border-t border-border/80 bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <PatternDivider variant="tilework" className="py-2 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold text-primary">
              {BRAND_CONFIG.name}
            </span>
            <span>—</span>
            <span>{BRAND_CONFIG.tagline}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/styleguide" className="hover:text-primary transition-colors">
              Design System
            </Link>
            <Link href="/seller" className="hover:text-primary transition-colors">
              Sell on Kaaravan
            </Link>
            <span>&copy; {new Date().getFullYear()} {BRAND_CONFIG.name}. Built with trust.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
