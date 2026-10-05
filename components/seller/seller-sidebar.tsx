"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Package, ShoppingCart, Settings, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export function SellerSidebar() {
  const pathname = usePathname();
  const t = useTranslations("seller");

  const navItems = [
    { label: t("nav.dashboard"), href: "/seller", icon: LayoutDashboard },
    { label: t("nav.orders"), href: "/seller/orders", icon: ShoppingCart },
    { label: t("nav.products"), href: "/seller/products", icon: Package },
    { label: t("nav.finances"), href: "/seller/finances", icon: DollarSign },
    { label: t("nav.settings"), href: "/seller/settings", icon: Settings },
  ];

  const isItemActive = (href: string) => {
    if (href === "/seller") {
      return pathname === "/seller";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Seller Menu (horizontal tabs) */}
      <nav
        aria-label="Seller mobile navigation"
        className="md:hidden flex items-center gap-1.5 overflow-x-auto p-2.5 border-b border-border bg-card no-scrollbar w-full shrink-0"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors overflow-hidden shrink-0",
                isActive
                  ? "bg-primary/10 text-primary font-semibold before:absolute before:start-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-primary before:rounded-full"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Seller Sidebar */}
      <aside className="hidden md:flex w-64 border-e border-border bg-card flex-col shrink-0 min-h-[calc(100vh-4rem)]">
        <div className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors overflow-hidden group",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold before:absolute before:start-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-primary before:rounded-full"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="mt-auto p-4 border-t border-border/80 text-[11px] text-muted-foreground">
          {t("dataIsolationNotice")}
        </div>
      </aside>
    </>
  );
}
