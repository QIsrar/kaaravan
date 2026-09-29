import Link from "next/link";
import { BRAND_CONFIG } from "@/config/brand";
import { PatternDivider } from "./pattern-divider";
import { useTranslations } from "next-intl";

export function StoreFooter() {
  const t = useTranslations("legal");
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

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-6">
              <Link href="/sell" className="hover:text-primary transition-colors">
                Sell on Kaaravan
              </Link>
            </div>
            <div className="flex items-center gap-4 text-[10px] sm:text-xs">
              <span>{t("copyright")}</span>
              <Link href="/legal/terms" className="hover:text-primary transition-colors">{t("terms")}</Link>
              <Link href="/legal/privacy" className="hover:text-primary transition-colors">{t("privacy")}</Link>
              <Link href="/legal/ip" className="hover:text-primary transition-colors">{t("ipNotice")}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
