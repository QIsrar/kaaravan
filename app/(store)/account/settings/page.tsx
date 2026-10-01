import React from "react";
import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getAccountDeletionRequest } from "@/lib/services/customer_accounts";
import { SettingsManager } from "@/components/store/settings-manager";

export default async function CustomerSettingsPage() {
  const profile = await requireAuth(["customer", "seller", "superadmin"]);
  const supabase = await createClient();

  const deletionRequest = await getAccountDeletionRequest(supabase, profile.id);

  return (
    <SettingsManager
      initialProfile={{
        id: profile.id,
        email: profile.email || null,
        fullName: profile.fullName || null,
        phone: profile.phone || null,
        role: profile.role,
      }}
      initialDeletionRequest={deletionRequest || null}
      sellerBusinessName={profile.seller_business_name || null}
    />
  );
}
