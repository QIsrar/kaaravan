import React from "react";
import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getAccountDeletionRequest } from "@/lib/services/customer_accounts";
import { SettingsManager } from "@/components/store/settings-manager";

export default async function CustomerSettingsPage() {
  const profile = await requireAuth(["customer", "seller", "superadmin"]);
  const supabase = await createClient();

  const [{ data: userProfile }, deletionRequest, { data: sellerData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("id", profile.id)
      .single(),
    getAccountDeletionRequest(supabase, profile.id),
    profile.role === "seller"
      ? supabase
          .from("sellers")
          .select("business_name")
          .eq("owner_profile_id", profile.id)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <SettingsManager
      initialProfile={{
        id: profile.id,
        email: profile.email || null,
        fullName: userProfile?.full_name || null,
        phone: userProfile?.phone || null,
        role: userProfile?.role || profile.role,
      }}
      initialDeletionRequest={deletionRequest || null}
      sellerBusinessName={sellerData?.business_name || null}
    />
  );
}
