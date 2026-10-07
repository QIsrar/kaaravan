import React from "react";
import { getSellerSettingsAction } from "@/lib/actions/seller-settings";
import { SettingsForm } from "@/components/seller/settings-form";

export default async function SellerSettingsPage() {
  const settings = await getSellerSettingsAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Shop Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your storefront and business details.</p>
        </div>
      </div>

      <SettingsForm initialData={settings} />
    </div>
  );
}
