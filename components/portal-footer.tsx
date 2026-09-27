import { useTranslations } from "next-intl";

export function PortalFooter() {
  const t = useTranslations("legal");
  return (
    <footer className="w-full py-4 text-center text-xs text-muted-foreground border-t border-border/40 mt-auto">
      <div className="container mx-auto px-4 max-w-4xl">
        <p>{t("portalCopyright")}</p>
      </div>
    </footer>
  );
}
