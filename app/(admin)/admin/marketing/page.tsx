import { requireAdminPermission } from "@/lib/auth/admin";
import { listAdminCoupons } from "@/lib/services/admin-marketing";
import { listAdminBanners } from "@/lib/services/admin-content";
import { MarketingClient } from "@/components/admin/marketing-client";
import { getTranslations } from "next-intl/server";

export default async function AdminMarketingPage() {
  const user = await requireAdminPermission("manage_promotions");
  const t = await getTranslations("admin");

  const [coupons, banners] = await Promise.all([
    listAdminCoupons(user.id, user.role),
    listAdminBanners(user.id, user.role),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("marketing")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure marketing discount coupons, promotional campaign codes, and bilingual storefront hero banners.
        </p>
      </div>

      <MarketingClient initialCoupons={coupons} initialBanners={banners} />
    </div>
  );
}

