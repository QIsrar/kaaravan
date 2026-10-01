import { Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SellerComingSoon } from "@/components/seller/seller-coming-soon";

export default async function SellerSettingsPage() {
  const t = await getTranslations("seller");
  return (
    <SellerComingSoon
      icon={Settings}
      title={t("comingSoon.settingsTitle")}
      description={t("comingSoon.settingsDesc")}
    />
  );
}
