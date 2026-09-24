import { requireAuth } from "@/lib/auth/roles";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
