import { ShoppingCart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SellerComingSoon } from "@/components/seller/seller-coming-soon";

export default async function SellerOrdersPage() {
  const t = await getTranslations("seller");
  return (
    <SellerComingSoon
      icon={ShoppingCart}
      title={t("comingSoon.ordersTitle")}
      description={t("comingSoon.ordersDesc")}
    />
  );
}
