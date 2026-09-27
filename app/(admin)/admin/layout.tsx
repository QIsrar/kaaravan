import { requireAuth } from "@/lib/auth/roles";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { PortalFooter } from "@/components/portal-footer";

/**
 * Superadmin Portal Layout
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * Defense-in-depth enforcement. Verifies that the authenticated session
 * has the 'superadmin' platform role before rendering.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(["superadmin"]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 p-6 md:p-8">{children}</div>
          <PortalFooter />
        </main>
      </div>
    </div>
  );
}
