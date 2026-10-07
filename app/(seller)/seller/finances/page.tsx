import { Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function SellerFinancesPage() {
  const t = await getTranslations("seller");
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-card border rounded-3xl">
      <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
        <Wallet className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl font-heading font-bold mb-4">{t("comingSoon.financesTitle")}</h1>
      <p className="text-lg text-muted-foreground max-w-md mx-auto">
        {t("comingSoon.financesDesc")}
      </p>
    </div>
  );
}
