"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  Star,
  Settings,
  LogOut,
  ShieldCheck,
  Store,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/roles";

interface AccountNavProps {
  profile: {
    id: string;
    email?: string | null;
    fullName?: string | null;
    role: UserRole;
  };
  sellerInfo?: {
    id: string;
    business_name: string;
  } | null;
}

export function AccountNav({ profile, sellerInfo }: AccountNavProps) {
  const pathname = usePathname();
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");

  const NAV_ITEMS = [
    {
      href: "/account",
      label: t("overview"),
      icon: LayoutDashboard,
      isActive: pathname === "/account",
    },
    {
      href: "/account/orders",
      label: t("orders"),
      icon: Package,
      isActive: pathname.startsWith("/account/orders"),
    },
    {
      href: "/account/wishlist",
      label: t("wishlist"),
      icon: Heart,
      isActive: pathname.startsWith("/account/wishlist"),
    },
    {
      href: "/account/addresses",
      label: t("addresses"),
      icon: MapPin,
      isActive: pathname.startsWith("/account/addresses"),
    },
    {
      href: "/account/reviews",
      label: t("reviews"),
      icon: Star,
      isActive: pathname.startsWith("/account/reviews"),
    },
    {
      href: "/account/settings",
      label: t("settings"),
      icon: Settings,
      isActive: pathname.startsWith("/account/settings"),
    },
  ];

  const initial = (profile.fullName || profile.email || "K").charAt(0).toUpperCase();
  const isSeller = profile.role === "seller";

  return (
    <div className="space-y-4">
      {/* Mobile Seller Banner */}
      {isSeller && (
        <div className="lg:hidden p-3.5 rounded-2xl border border-secondary/40 bg-secondary/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Store className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate">
              {t("sellerBanner", { name: sellerInfo?.business_name || "Artisan Workshop" })}
            </span>
          </div>
          <Link href="/seller" className="shrink-0">
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs font-semibold h-7 px-2.5"
            >
              {t("goToSellerPortal")}
            </Button>
          </Link>
        </div>
      )}

      {/* Mobile Horizontal Tabs */}
      <nav
        aria-label="Account navigation tabs"
        className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all shrink-0 overflow-hidden",
                item.isActive
                  ? "bg-primary/10 text-primary font-bold shadow-2xs before:absolute before:start-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-primary before:rounded-full"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", item.isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar Card */}
      <div className="hidden lg:block rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-5">
        {/* User Card */}
        <div className="flex items-center gap-3 pb-4 border-b border-border/70">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-heading font-extrabold text-lg shadow-xs ring-2 ring-secondary/40 shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-bold text-sm text-foreground truncate">
              {profile.fullName || t("title")}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            {!isSeller && (
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold uppercase tracking-wider border-primary/20 bg-primary/5 text-primary py-0"
                >
                  <ShieldCheck className="w-2.5 h-2.5 me-1 text-primary" />
                  {profile.role}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* For Sellers: Banner with Go to Seller Portal button replacing role badge */}
        {isSeller && (
          <div className="p-3.5 rounded-2xl border border-secondary/40 bg-secondary/10 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Store className="w-4 h-4 text-primary shrink-0" />
              <span className="line-clamp-2">
                {t("sellerBanner", { name: sellerInfo?.business_name || "Artisan Workshop" })}
              </span>
            </div>
            <Link href="/seller" className="block">
              <Button
                type="button"
                size="sm"
                className="w-full rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs font-semibold h-8"
              >
                {t("goToSellerPortal")}
              </Button>
            </Link>
          </div>
        )}

        {/* Navigation Links */}
        <nav aria-label="Account navigation sidebar" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group overflow-hidden",
                  item.isActive
                    ? "bg-primary/10 text-primary font-bold shadow-2xs before:absolute before:start-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-primary before:rounded-full"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    item.isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  )}
                />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="pt-3 border-t border-border/70">
          <button
            type="button"
            onClick={() => signOutAction()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors text-start"
          >
            <LogOut className="w-4 h-4" />
            <span>{tAuth("signOut")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
