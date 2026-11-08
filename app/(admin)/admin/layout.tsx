import { requireAuth } from "@/lib/auth/roles";
import { getAdminMfaStatus, getAdminUserPermissions } from "@/lib/auth/admin";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { PortalFooter } from "@/components/portal-footer";

/**
 * Admin Portal Layout
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * Defense-in-depth enforcement. Verifies that the authenticated session
 * has the 'superadmin' or 'admin_staff' platform role and satisfies
 * MFA (Supabase session aal2) before rendering admin control interfaces.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth(["superadmin", "admin_staff"]);
  const permissions = await getAdminUserPermissions(profile.id, profile.role);
  const isSuperadmin = profile.role === "superadmin";

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // If on MFA challenge or enrollment screens, avoid redirect loop
  if (!pathname.startsWith("/admin/mfa")) {
    const mfaStatus = await getAdminMfaStatus();
    if (mfaStatus === "needs_enrolment") {
      redirect("/admin/mfa/enroll");
    } else if (mfaStatus === "needs_verification") {
      redirect("/admin/mfa");
    }
  }

  // If visiting MFA screen directly, don't show the full admin sidebar
  if (pathname.startsWith("/admin/mfa")) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AdminHeader />
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          {children}
        </main>
        <PortalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar permissions={permissions} isSuperadmin={isSuperadmin} />
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 p-6 md:p-8">{children}</div>
          <PortalFooter />
        </main>
      </div>
    </div>
  );
}
