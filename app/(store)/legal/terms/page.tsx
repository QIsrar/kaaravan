import { useTranslations } from "next-intl";

export default function TermsOfUsePage() {
  const t = useTranslations("legal");
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="font-heading text-3xl font-bold mb-8">{t("terms")}</h1>
      <div className="p-8 bg-secondary/30 text-secondary-foreground border border-secondary rounded-xl mb-8">
        <p className="font-semibold text-center">{t("draftNotice")}</p>
      </div>
    </div>
  );
}
