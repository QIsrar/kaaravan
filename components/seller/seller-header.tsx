"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BRAND_CONFIG } from "@/config/brand";
import { Store, LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { LanguageSwitcher } from "@/components/store/language-switcher";

interface SellerHeaderProps {
  sellerName?: string;
}

export function SellerHeader({ sellerName }: SellerHeaderProps) {
  const t = useTranslations("seller");
  const displayName = sellerName || t("defaultPartnerName");

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-heading font-bold text-lg text-primary">
          {BRAND_CONFIG.name}
        </Link>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          {t("portalBadge")}
        </span>
      </div>

      <div className="flex items-center gap-3">
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
