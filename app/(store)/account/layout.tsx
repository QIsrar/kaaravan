import React from "react";
import { requireAuth } from "@/lib/auth/roles";
import { AccountNav } from "@/components/store/account-nav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth(["customer", "seller", "superadmin"]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <aside className="lg:col-span-1">
          <AccountNav
            profile={{
              id: profile.id,
              email: profile.email,
              fullName: profile.fullName ?? null,
              role: profile.role,
            }}
            sellerInfo={
              profile.seller_id && profile.seller_business_name
                ? { id: profile.seller_id, business_name: profile.seller_business_name }
                : null
            }
          />
        </aside>
        <div className="lg:col-span-3 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
