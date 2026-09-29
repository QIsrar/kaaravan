import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Store, ShieldCheck, Truck, Sparkles, ArrowRight, Coins, Users, CheckCircle2 } from "lucide-react";
import { PatternDivider } from "@/components/store/pattern-divider";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { getOptionalUserRole } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Sell on Kaaravan — Partner with Pakistan's Artisan Marketplace",
  description: "Join Kaaravan as a verified merchant or artisan guild. Fair commissions, transparent logistics, and nationwide buyers.",
};

export default async function SellPage() {
  const tLegal = await getTranslations("legal");
  const userRole = await getOptionalUserRole();
  const isApprovedSeller = userRole?.isApprovedSeller ?? false;

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 space-y-16 max-w-5xl">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground text-xs font-bold border border-secondary/30">
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          <span>Seller Onboarding — Coming Soon</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
          Bring Your Handcrafted Heritage to the Kaaravan
        </h1>

        <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed">
          The modern multi-vendor marketplace designed specifically for Pakistani artisans, heritage workshops, and independent merchants. We handle shipping pickups, secure payments, and buyer trust so you can focus on making timeless craft.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          {isApprovedSeller && (
            <Link href="/seller">
              <Button size="lg" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 shadow-md">
                <Store className="w-4 h-4 me-2" />
                <span>Go to My Seller Portal</span>
              </Button>
            </Link>
          )}
          <Link href="/">
            <Button size="lg" variant={isApprovedSeller ? "outline" : "default"} className="rounded-xl">
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </div>

      <PatternDivider variant="tilework" className="py-2" />

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-border bg-card shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-foreground">
            Fair &amp; Transparent Rates
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            No hidden deductions or predatory fees. Fixed commission rates (5–8%) with a permanent, tamper-proof record of every transaction.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-border bg-card shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-foreground">
            Automated Doorstep Pickups
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Integrated with major Pakistani logistics couriers. Couriers collect boxed shipments directly from your workshop in any city.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-border bg-card shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-foreground">
            COD Confirmation &amp; Fraud Shield
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Automated IVR and WhatsApp verification before order dispatch to protect merchants from high return-to-origin (RTO) courier costs.
          </p>
        </div>
      </div>

      {/* Founding Guilds Onboarding Notice */}
      <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Founding Merchant Cohort</span>
          </div>

          <h2 className="font-heading text-2xl font-bold text-foreground">
            Actively onboarding guild masters across Pakistan
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Right now, our team is curating our founding merchant cohort from Multan Kashikari, Namak Mandi leather artisans, Chiniot woodworkers, and Hunza organic cooperatives. Self-serve vendor registration and inventory management are coming soon.
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full autonomy over your own storefront and inventory</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct IBFT bank payouts into verified Pakistani business accounts</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Urdu and English multilingual listing editor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Portal Legal Notice */}
      <div className="text-center text-xs text-muted-foreground max-w-2xl mx-auto pt-6 border-t border-border">
        {tLegal("portalCopyright")}
      </div>
    </div>
  );
}
