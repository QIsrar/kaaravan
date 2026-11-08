import { requireAdminPermission } from "@/lib/auth/admin";
import { listBankChangeRequests } from "@/lib/services/admin-finance";
import { BankRequestsClient } from "@/components/admin/bank-requests-client";
import { getTranslations } from "next-intl/server";

export default async function AdminBankRequestsPage() {
  const user = await requireAdminPermission("manage_finance");
  const t = await getTranslations("admin");
  const requests = await listBankChangeRequests(user.id, user.role);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("bankRequests")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review and audit seller payout bank account modifications before committing to the financial ledger.
        </p>
      </div>

      <BankRequestsClient initialRequests={requests} />
    </div>
  );
}

