import { Package } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SellerComingSoon } from "@/components/seller/seller-coming-soon";

export default async function SellerProductsPage() {
  const t = await getTranslations("seller");
  return (
    <SellerComingSoon
      icon={Package}
      title={t("comingSoon.productsTitle")}
      description={t("comingSoon.productsDesc")}
    />
  );
}
