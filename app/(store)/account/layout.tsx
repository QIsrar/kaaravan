import React from "react";
import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { AccountNav } from "@/components/store/account-nav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth(["customer", "seller", "superadmin"]);
  const supabase = await createClient();

  const [{ data: dbProfile }, { data: sellerData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", profile.id)
      .single(),
    profile.role === "seller"
      ? supabase
          .from("sellers")
          .select("id, business_name")
          .eq("owner_profile_id", profile.id)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <aside className="lg:col-span-1">
          <AccountNav
            profile={{
              id: profile.id,
              email: profile.email,
              fullName: dbProfile?.full_name ?? null,
              role: profile.role,
            }}
            sellerInfo={sellerData ?? null}
          />
        </aside>
        <div className="lg:col-span-3 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
