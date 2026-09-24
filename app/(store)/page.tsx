import Link from "next/link";
import { ArrowRight, Compass, ShieldCheck, Sparkles, Store } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { PatternDivider } from "@/components/store/pattern-divider";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl text-center">
      {/* Visual Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Phase 1: Multi-Vendor Architecture Foundation</span>
      </div>

      <h1 className="font-heading text-4xl sm:text-6xl font-extrabold text-foreground tracking-tight max-w-3xl mx-auto leading-tight">
        A Trusted Marketplace Journey Across Pakistan
      </h1>

      <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        {BRAND_CONFIG.name} unites merchants, artisans, and shoppers across Pakistan
        in a fair, dependable, and community-centered multi-vendor caravan.
      </p>

      {/* Primary Actions */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link href="/styleguide">
          <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
            <span>Explore Design System & Style Guide</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/seller">
          <Button variant="outline" size="lg" className="gap-2">
            <Store className="w-4 h-4 text-primary" />
            <span>Seller Portal</span>
          </Button>
        </Link>
        <Link href="/admin">
          <Button variant="ghost" size="lg" className="gap-2 text-muted-foreground hover:text-foreground">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin</span>
          </Button>
        </Link>
      </div>

      <PatternDivider variant="tilework" className="my-16" />

      {/* Foundation Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
            The Caravan Journey
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Order tracking redesigned as milestone stops along a route (Placed → Packed → On the way → Arrived).
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
            Non-Negotiable Integrity
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paisa integer minor units, server-side recalculation, default-deny RLS, and immutable audit logs.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-secondary/30 text-primary flex items-center justify-center font-bold mb-4">
            <Store className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
            Multi-Tenant Isolation
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Independent portals for sellers, superadmin, and storefront with defense-in-depth layout verification.
          </p>
        </div>
      </div>
    </div>
  );
}
