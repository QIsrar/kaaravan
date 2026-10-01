import { DollarSign } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SellerComingSoon } from "@/components/seller/seller-coming-soon";

export default async function SellerFinancesPage() {
  const t = await getTranslations("seller");
  return (
    <SellerComingSoon
      icon={DollarSign}
      title={t("comingSoon.financesTitle")}
      description={t("comingSoon.financesDesc")}
    />
  );
}
