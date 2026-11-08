import { requireAdminPermission } from "@/lib/auth/admin";
import { listAdminSettings } from "@/lib/services/admin-settings";
import { SettingsClient } from "@/components/admin/settings-client";
import { getTranslations } from "next-intl/server";

export default async function AdminSettingsPage() {
  const user = await requireAdminPermission("manage_settings");
  const t = await getTranslations("admin");
  const settings = await listAdminSettings(user.id, user.role);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("settings")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage system configuration values and toggle public availability flags for storefront clients.
        </p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}

