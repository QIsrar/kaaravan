import { requireAuth } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { listAdminStaff } from "@/lib/services/admin-staff";
import { StaffClient } from "@/components/admin/staff-client";
import { getTranslations } from "next-intl/server";

export default async function AdminStaffPage() {
  const user = await requireAuth(["superadmin", "admin_staff"]);
  if (user.role !== "superadmin") {
    redirect("/unauthorized");
  }

  const t = await getTranslations("admin");
  const staff = await listAdminStaff(user.role);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("staff")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Superadmin access control: assign staff members and manage modular granular administrative permissions.
        </p>
      </div>

      <StaffClient initialStaff={staff} />
    </div>
  );
}

