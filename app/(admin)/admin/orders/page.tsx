import { requireAdminPermission } from "@/lib/auth/admin";
import { listAdminSubOrders } from "@/lib/services/admin-orders";
import { OrdersClient } from "@/components/admin/orders-client";
import { getTranslations } from "next-intl/server";

export default async function AdminOrdersPage() {
  const user = await requireAdminPermission("manage_orders");
  const t = await getTranslations("admin");
  const subOrders = await listAdminSubOrders(user.id, user.role);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("orders")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor marketplace orders across vendors, inspect delivery timelines, and execute administrative overrides.
        </p>
      </div>

      <OrdersClient initialSubOrders={subOrders} />
    </div>
  );
}

