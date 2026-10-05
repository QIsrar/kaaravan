"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BRAND_CONFIG } from "@/config/brand";
import { Image } from "@/components/ui/image";
import {
  Store,
  LogOut,
  Menu,
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  Settings,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { LanguageSwitcher } from "@/components/store/language-switcher";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLinkItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SellerHeaderProps {
  sellerName?: string;
}

export function SellerHeader({ sellerName }: SellerHeaderProps) {
  const pathname = usePathname();
  const t = useTranslations("seller");
  const displayName = sellerName || t("defaultPartnerName");

  const navItems = [
    { label: t("nav.dashboard"), href: "/seller", icon: LayoutDashboard },
    { label: t("nav.orders"), href: "/seller/orders", icon: ShoppingCart },
    { label: t("nav.products"), href: "/seller/products", icon: Package },
    { label: t("nav.finances"), href: "/seller/finances", icon: DollarSign },
    { label: t("nav.settings"), href: "/seller/settings", icon: Settings },
  ];

  const isItemActive = (href: string) => {
    if (href === "/seller") return pathname === "/seller";
    return pathname.startsWith(href);
  };

  return (
    <header className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Hamburger Menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-foreground hover:bg-muted"
                  aria-label="Toggle Seller Menu"
                />
              }
            >
              <Menu className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1.5 space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.href);
                return (
                  <DropdownMenuLinkItem
                    key={item.href}
                    render={
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                      />
                    }
                    className={cn(
                      "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors overflow-hidden",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold before:absolute before:start-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-primary before:rounded-full"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span>{item.label}</span>
                  </DropdownMenuLinkItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href="/" className="flex items-center gap-2">
          <Image
            src={BRAND_CONFIG.symbolPath}
            alt={BRAND_CONFIG.name}
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg object-contain shadow-2xs"
          />
          <span className="font-heading font-bold text-lg text-primary">
            {BRAND_CONFIG.name}
          </span>
        </Link>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium hidden sm:inline">
          {t("portalBadge")}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher />
        <div className="flex items-center gap-2 text-sm text-foreground">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-medium hidden sm:inline">
            <bdi dir="auto">{displayName}</bdi>
          </span>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors px-2.5 py-1.5 rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("signOut")}</span>
          </button>
        </form>
      </div>
    </header>
  );
}
