import { requireAdminPermission } from "@/lib/auth/admin";
import { listAdminCouriers } from "@/lib/services/admin-logistics";
import { CouriersClient } from "@/components/admin/couriers-client";
import { getTranslations } from "next-intl/server";

export default async function AdminCouriersPage() {
  const user = await requireAdminPermission("manage_logistics");
  const t = await getTranslations("admin");
  const couriers = await listAdminCouriers(user.id, user.role);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("couriers")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Enable or disable domestic courier adapters and configure operational shipping rate cards.
        </p>
      </div>

      <CouriersClient initialCouriers={couriers} />
    </div>
  );
}

