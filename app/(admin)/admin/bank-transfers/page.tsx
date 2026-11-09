/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { requireAdminPermission } from "@/lib/auth/admin";
import { listBankTransferProofs } from "@/lib/services/admin-finance";
import { BankTransfersClient } from "@/components/admin/bank-transfers-client";
import { getTranslations } from "next-intl/server";

export default async function AdminBankTransfersPage() {
  const user = await requireAdminPermission("manage_finance");
  const t = await getTranslations("admin");
  const proofs = await listBankTransferProofs(user.id, user.role, { status: "all" });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("bankTransfers")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {t("bankTransfersDesc")}
        </p>
      </div>

      <BankTransfersClient initialProofs={proofs} />
    </div>
  );
}

