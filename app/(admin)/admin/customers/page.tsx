import { requireAdminPermission } from "@/lib/auth/admin";
import { listAdminCustomers } from "@/lib/services/admin-users";
import { CustomersClient } from "@/components/admin/customers-client";
import { getTranslations } from "next-intl/server";

export default async function AdminCustomersPage() {
  const user = await requireAdminPermission("manage_users");
  const t = await getTranslations("admin");
  const customers = await listAdminCustomers(user.id, user.role);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("customers")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Inspect customer accounts, review purchase frequencies, and manage platform safety blocks.
        </p>
      </div>

      <CustomersClient initialCustomers={customers} />
    </div>
  );
}

