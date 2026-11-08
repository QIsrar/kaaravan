import { requireAuth } from "@/lib/auth/roles";
import { listAdminAuditLogs } from "@/lib/services/admin-audit";
import { AuditClient } from "@/components/admin/audit-client";
import { getTranslations } from "next-intl/server";

export default async function AdminAuditPage() {
  const user = await requireAuth(["superadmin"]);
  const t = await getTranslations("admin");
  const logs = await listAdminAuditLogs(user.role, { limit: 100 });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("audit")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Immutable platform audit trail recording administrative mutations, IP addresses, and state diffs.
        </p>
      </div>

      <AuditClient initialLogs={logs} />
    </div>
  );
}

