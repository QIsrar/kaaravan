import { requireAdminPermission } from "@/lib/auth/admin";
import { listAdminSellers } from "@/lib/services/admin-sellers";
import { SellersClient } from "@/components/admin/sellers-client";
import { getTranslations } from "next-intl/server";

export default async function AdminSellersPage() {
  const user = await requireAdminPermission("manage_sellers");
  const t = await getTranslations("admin");
  const sellers = await listAdminSellers(user.id, user.role);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("sellers")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review onboarding merchant applications, inspect KYC records, and manage vendor platform access.
        </p>
      </div>

      <SellersClient initialSellers={sellers} />
    </div>
  );
}
