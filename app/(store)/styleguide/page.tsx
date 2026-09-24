"use client";

import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Smartphone,
  Monitor,
  ShoppingBag,
  Sparkles,
  Store,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Truck,
  Heart,
  Tag,
  Flame,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PatternDivider } from "@/components/store/pattern-divider";
import { JourneyTracker } from "@/components/store/journey-tracker";
import type { JourneyStop } from "@/lib/couriers/types";

export default function StyleguidePage() {
  const [isDark, setIsDark] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [activeStop, setActiveStop] = useState<JourneyStop>("on_the_way");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasDark = document.documentElement.classList.contains("dark");
    setIsDark(hasDark);
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl transition-colors">
      {/* Styleguide Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card shadow-xs mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-secondary text-primary font-semibold">
              Direction 2: Modern Bazaar
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Solid Surfaces &bull; Golden Waypoints
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mt-1">
            Kaaravan Design System &amp; Component Style Guide
          </h1>
        </div>

        {/* Interactive Controls */}
        <div className="flex items-center gap-2.5">
          {/* Mobile 375px Toggle */}
          <Button
            variant={isMobilePreview ? "accent" : "outline"}
            size="sm"
            onClick={() => setIsMobilePreview(!isMobilePreview)}
            className="gap-1.5"
            aria-label="Toggle 375px Mobile Viewport Check"
          >
            {isMobilePreview ? (
              <>
                <Monitor className="w-4 h-4" />
                <span>Full Desktop View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span>Mobile (375px) Check</span>
              </>
            )}
          </Button>

          {/* Dark Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDarkMode}
            className="gap-1.5"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-secondary" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-primary" />
                <span>Dark</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Container or 375px Mobile Frame Simulation */}
      <div
        className={
          isMobilePreview
            ? "w-[375px] mx-auto border-4 border-foreground/80 rounded-[40px] p-4 bg-background shadow-2xl overflow-y-auto max-h-[85vh]"
            : "w-full space-y-12"
        }
      >
        {isMobilePreview && (
          <div className="w-24 h-4 bg-foreground/20 rounded-full mx-auto mb-4" />
        )}

        {/* 1. BRAND TOKENS & TYPOGRAPHY SPECIMEN */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              01 &bull; Foundations
            </span>
            <h2 className="font-heading text-xl font-bold text-foreground">
              Color Tokens &amp; Typography
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
              <div className="w-full h-10 rounded-lg bg-primary mb-2 shadow-xs" />
              <span className="text-xs font-bold text-foreground block">Primary Teal</span>
              <span className="text-[10px] text-muted-foreground font-mono">oklch(0.35 0.08 190)</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
              <div className="w-full h-10 rounded-lg bg-accent mb-2 shadow-xs" />
              <span className="text-xs font-bold text-foreground block">Terracotta Accent</span>
              <span className="text-[10px] text-muted-foreground font-mono">oklch(0.58 0.16 35)</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
              <div className="w-full h-10 rounded-lg bg-secondary mb-2 shadow-xs" />
              <span className="text-xs font-bold text-foreground block">Warm Gold</span>
              <span className="text-[10px] text-muted-foreground font-mono">oklch(0.88 0.08 78)</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
              <div className="w-full h-10 rounded-lg bg-muted border border-border mb-2 shadow-xs" />
              <span className="text-xs font-bold text-foreground block">Desert Sand</span>
              <span className="text-[10px] text-muted-foreground font-mono">oklch(0.95 0.015 85)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div>
              <p className="font-heading text-2xl font-extrabold text-foreground">
                Heading Display (Outfit) &bull; 24px Bold
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Body Sans (Plus Jakarta Sans) &bull; Clean, accessible, optimized for mobile readability across Pakistan.
              </p>
            </div>
          </div>
        </section>

        {/* 2. BUTTONS & ACTIONS */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              02 &bull; Interactive Elements
            </span>
            <h2 className="font-heading text-xl font-bold text-foreground">
              Buttons &amp; Actions
            </h2>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Terracotta Primary CTA */}
              <Button variant="accent" size="default" className="gap-2">
                <Flame className="w-4 h-4" />
                <span>Explore Bazaar</span>
              </Button>

              {/* Deep Teal Secondary */}
              <Button variant="default" size="default" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>View Details</span>
              </Button>

              {/* Warm Gold Accent */}
              <Button variant="secondary" size="default" className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Limited Offer</span>
              </Button>

              {/* Outline */}
              <Button variant="outline" size="default">
                Outline Action
              </Button>

              {/* Ghost */}
              <Button variant="ghost" size="default">
                Ghost Link
              </Button>

              {/* Disabled */}
              <Button variant="accent" disabled size="default">
                Disabled State
              </Button>
            </div>

            {/* Size Variants */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
              <Button variant="accent" size="sm">
                Small (sm)
              </Button>
              <Button variant="accent" size="default">
                Default (md)
              </Button>
              <Button variant="accent" size="lg" className="gap-2">
                <span>Large CTA (lg)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* 3. INPUTS & FORM CONTROLS */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              03 &bull; Form Controls
            </span>
            <h2 className="font-heading text-xl font-bold text-foreground">
              Inputs &amp; Search
            </h2>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Default Input
              </label>
              <Input
                type="text"
                placeholder="Search products or artisans..."
                className="rounded-xl border-border bg-background"
              />
              <span className="text-[11px] text-muted-foreground">Standard search field</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-primary uppercase tracking-wider">
                Active / Focused
              </label>
              <Input
                type="text"
                defaultValue="Multani Blue Pottery"
                className="rounded-xl border-primary ring-2 ring-primary/20 bg-background"
              />
              <span className="text-[11px] text-primary">Focused with primary teal ring</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Error State</span>
              </label>
              <Input
                type="email"
                defaultValue="invalid-format-pk"
                className="rounded-xl border-destructive ring-2 ring-destructive/20 bg-background"
              />
              <span className="text-[11px] text-destructive">Please enter a valid email address</span>
            </div>
          </div>
        </section>

        {/* 4. BADGES & SELLER VERIFICATION */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              04 &bull; Micro-Signatures
            </span>
            <h2 className="font-heading text-xl font-bold text-foreground">
              Badges &amp; Geometric Seller Marks
            </h2>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">
                Category &amp; Status Badges
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent" className="gap-1">
                  <Flame className="w-3 h-3" />
                  <span>Featured Artisan</span>
                </Badge>
                <Badge variant="default" className="gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Textiles</span>
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Jewelry</span>
                </Badge>
                <Badge variant="outline">Handmade</Badge>
                <Badge variant="destructive">Low Stock</Badge>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">
                Seller Verification Micro-Motifs (Pakistani Tilework)
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {/* Tilework Verified Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold shadow-2xs">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-primary">
                    <polygon points="7,1 13,7 7,13 1,7" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
                    <circle cx="7" cy="7" r="2" fill="currentColor" />
                  </svg>
                  <span>Verified Kaaravan Merchant</span>
                </div>

                {/* Silk Route Certified */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-secondary/50 bg-secondary/15 text-foreground text-xs font-semibold shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                  <span>Authentic Craft Certified</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. JOURNEY-STYLE ORDER TRACKER (FEATURING DIRECTION 1 GOLDEN WAYPOINT NODES) */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                05 &bull; The Caravan Route
              </span>
              <h2 className="font-heading text-xl font-bold text-foreground">
                Order Journey Tracker (Golden Glowing Waypoints)
              </h2>
            </div>

            {/* Interactive Step Switcher */}
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl">
              {(["placed", "packed", "on_the_way", "arrived"] as JourneyStop[]).map((stop) => (
                <button
                  key={stop}
                  onClick={() => setActiveStop(stop)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeStop === stop
                      ? "bg-card text-primary font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {stop === "on_the_way" ? "On The Way" : stop.charAt(0).toUpperCase() + stop.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <JourneyTracker
            currentStop={activeStop}
            orderNumber="KV-98241"
            estimatedArrival="Tomorrow by 5 PM"
            onStopChange={(stop) => setActiveStop(stop)}
          />
          <p className="text-xs text-muted-foreground italic">
            Tip: Click any milestone or use the switcher above to test the glowing golden waypoint node in action.
          </p>
        </section>

        {/* 6. PATTERN DIVIDERS & SECTION ACCENTS */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              06 &bull; Geometric Visual Signatures
            </span>
            <h2 className="font-heading text-xl font-bold text-foreground">
              Subtle Pakistani Truck Art &amp; Tilework Dividers
            </h2>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1 uppercase font-medium">
                Variant 1: Diamond Tilework
              </p>
              <PatternDivider variant="tilework" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1 uppercase font-medium">
                Variant 2: Caravan Trail Route
              </p>
              <PatternDivider variant="caravan-route" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1 uppercase font-medium">
                Variant 3: Floral Geometric Medallion
              </p>
              <PatternDivider variant="floral-geo" />
            </div>
          </div>
        </section>

        {/* 7. CARDS & CONTAINERS (SOLID SURFACES ONLY, NO GLASSMORPHISM) */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              07 &bull; Structural Cards
            </span>
            <h2 className="font-heading text-xl font-bold text-foreground">
              Solid Surface Cards &amp; Product Hero
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Product Card Example */}
            <Card className="rounded-2xl border border-border bg-card shadow-xs hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-44 bg-muted flex items-center justify-center relative border-b border-border">
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                  Product Image Hero
                </span>
                <Badge variant="accent" className="absolute top-3 left-3 shadow-xs">
                  Handcrafted
                </Badge>
                <button
                  type="button"
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-card border border-border text-muted-foreground hover:text-accent shadow-2xs"
                  aria-label="Add to wishlist"
                >
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              <CardHeader className="p-4 pb-1">
                <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                  Chiniot Woodcraft
                </div>
                <CardTitle className="text-base font-bold text-foreground">
                  Hand-Carved Walnut Keepsake Box
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 pb-3">
                <div className="flex items-baseline gap-2">
                  {/* Money strictly formatted as minor units in Paisa */}
                  <span className="text-lg font-extrabold text-foreground">
                    PKR 4,850
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    PKR 5,500
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sold by <span className="text-primary font-semibold">Lahore Heritage Guild</span>
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="accent" size="sm" className="w-full gap-2 font-medium">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Join Caravan Cart</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Merchant Guild Card */}
            <Card className="rounded-2xl border border-border bg-card shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Peshawar Leather Guild
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Generational artisans creating authentic pure leather chappals and travel satchels across Khyber.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                    48 Products
                  </Badge>
                  <Badge variant="outline" className="border-secondary text-foreground text-[10px]">
                    ★ 4.9 Rating
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-6 w-full gap-1.5">
                <span>View Merchant Showcase</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Card>

            {/* Trust & Guarantee Card */}
            <Card className="rounded-2xl border border-secondary/40 bg-secondary/5 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-secondary/20 text-primary flex items-center justify-center font-bold mb-3">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  The Kaaravan Covenant
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Every order is protected by our Fair Trade guarantee. All transactions are securely audited and dispatched through verified regional logistics.
                </p>
              </div>
              <div className="mt-6 text-[11px] font-semibold text-primary flex items-center gap-1">
                <span>100% Inspected &bull; Paisa-Exact Minor Units</span>
              </div>
            </Card>
          </div>
        </section>

        {/* 8. DATA TABLE (RESPONSIVE MERCHANT ROSTER) */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              08 &bull; Data Presentation
            </span>
            <h2 className="font-heading text-xl font-bold text-foreground">
              Responsive Merchant Orders Table
            </h2>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border">
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">Order ID</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">Customer</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">Journey Stop</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground text-right">Amount (PKR)</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-border hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono font-medium text-xs text-foreground">#KV-98241</TableCell>
                    <TableCell className="text-sm font-medium text-foreground">Hamza Siddiqui (Islamabad)</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold">
                        <Truck className="w-3.5 h-3.5 text-secondary" />
                        <span>On the way</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-foreground">
                      PKR 14,200
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="border-secondary text-primary text-[10px]">
                        In Transit
                      </Badge>
                    </TableCell>
                  </TableRow>

                  <TableRow className="border-border hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono font-medium text-xs text-foreground">#KV-98239</TableCell>
                    <TableCell className="text-sm font-medium text-foreground">Fatima Noor (Karachi)</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        <span>Arrived</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-foreground">
                      PKR 8,750
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="text-[10px]">
                        Settled
                      </Badge>
                    </TableCell>
                  </TableRow>

                  <TableRow className="border-border hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono font-medium text-xs text-foreground">#KV-98235</TableCell>
                    <TableCell className="text-sm font-medium text-foreground">Zainab Khan (Lahore)</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs text-accent font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        <span>Packed</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-foreground">
                      PKR 22,400
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="accent" className="text-[10px]">
                        Processing
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </section>

        {/* 9. URDU RTL PARITY SECTION */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              09 &bull; Urdu &amp; RTL Readiness
            </span>
            <h2 className="font-heading text-xl font-bold text-foreground">
              اردو زبان اور دائیں سے بائیں (RTL) پیش منظر
            </h2>
          </div>

          <div
            dir="rtl"
            className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6 text-right font-urdu"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>کارواں پاکستان: قابل اعتماد تجارتی سفر</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground leading-relaxed">
                آپ کا آرڈر کارواں میں شامل ہو چکا ہے!
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-loose max-w-2xl">
                ہم پاکستان بھر کے بہترین ہنر مندوں، دکانداروں اور خریداروں کو ایک محفوظ اور قابل اعتماد کارواں میں جوڑتے ہیں۔
              </p>
            </div>

            {/* Urdu Buttons Matrix */}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="accent" size="default" className="font-urdu text-sm font-bold gap-2">
                <span>ٹوکری میں شامل کریں</span>
                <ShoppingBag className="w-4 h-4" />
              </Button>
              <Button variant="default" size="default" className="font-urdu text-sm font-bold gap-2">
                <span>آرڈر ٹریک کریں</span>
                <Truck className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="default" className="font-urdu text-sm">
                سیلر سے رابطہ کریں
              </Button>
            </div>

            {/* Urdu Form Input Sample */}
            <div className="max-w-md space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                ترسیل کا پتہ (ڈیلیوری ایڈریس)
              </label>
              <Input
                dir="rtl"
                placeholder="گھر کا پتہ، گلی نمبر، شہر..."
                className="rounded-xl border-border bg-background font-urdu text-sm"
              />
              <span className="text-[11px] text-muted-foreground block">
                تمام معلومات انکرپٹڈ اور محفوظ رکھی جاتی ہیں۔
              </span>
            </div>

            <PatternDivider variant="tilework" className="py-2" />
          </div>
        </section>
      </div>
    </div>
  );
}
