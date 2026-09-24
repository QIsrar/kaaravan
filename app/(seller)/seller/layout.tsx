import { requireAuth } from "@/lib/auth/roles";
import { SellerHeader } from "@/components/seller/seller-header";
import { SellerSidebar } from "@/components/seller/seller-sidebar";

/**
 * Seller Portal Layout
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * Defense-in-depth enforcement. Middleware provides fast redirect,
 * but this server layout independently verifies authentication and authorization
 * directly from the session/profile before rendering.
 */
export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth(["seller", "superadmin"]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SellerHeader sellerName={profile.email || "Merchant Partner"} />
      <div className="flex flex-1">
        <SellerSidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
