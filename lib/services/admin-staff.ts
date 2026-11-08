/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { adminPermissionSchema, type AdminPermission } from "@/lib/validators/admin";

export async function listAdminStaff(adminRole: string) {
  if (adminRole !== "superadmin") {
    throw new Error("Access denied: only superadmin can manage staff");
  }

  const adminClient = createAdminClient();

  const { data: staff, error: staffErr } = await adminClient
    .from("profiles")
    .select(`
      id,
      full_name,
      phone,
      role,
      status,
      created_at,
      admin_permissions (
        id,
        permission
      )
    `)
    .in("role", ["superadmin", "admin_staff"])
    .order("created_at", { ascending: true });

  if (staffErr) {
    console.error("Failed to list admin staff:", staffErr.message);
    throw new Error("Failed to load staff list");
  }

  // Fetch emails from auth.users
  const emailMap = new Map<string, string>();
  try {
    const { data: authUsers } = await adminClient.auth.admin.listUsers();
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        if (u.email) emailMap.set(u.id, u.email);
      }
    }
  } catch (e) {
    console.error("Failed to fetch user emails for staff:", e);
  }

  return (staff || []).map((s) => ({
    id: s.id,
    fullName: s.full_name,
    phone: s.phone,
    email: emailMap.get(s.id) || null,
    role: s.role,
    status: s.status,
    createdAt: s.created_at,
    permissions: (s.admin_permissions || []).map((p) =>
      adminPermissionSchema.parse(p.permission)
    ),
  }));
}

export type AdminStaffListItem = Awaited<ReturnType<typeof listAdminStaff>>[number];

export async function updateStaffPermissions(
  targetProfileId: string,
  newPermissions: AdminPermission[],
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  if (adminRole !== "superadmin") {
    throw new Error("Access denied: only superadmin can assign staff permissions");
  }

  const adminClient = createAdminClient();

  // Verify target is an admin_staff
  const { data: targetProfile, error: profileErr } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", targetProfileId)
    .single();

  if (profileErr || !targetProfile) {
    throw new Error("Staff member not found");
  }

  // Fetch current permissions
  const { data: existing } = await adminClient
    .from("admin_permissions")
    .select("permission")
    .eq("profile_id", targetProfileId);

  const existingPermissions = (existing || []).map((e) => e.permission);

  // Delete all existing permissions
  await adminClient
    .from("admin_permissions")
    .delete()
    .eq("profile_id", targetProfileId);

  // Insert new permissions
  if (newPermissions.length > 0) {
    const rows = newPermissions.map((perm) => ({
      profile_id: targetProfileId,
      permission: perm,
    }));

    const { error: insertErr } = await adminClient
      .from("admin_permissions")
      .insert(rows);

    if (insertErr) {
      console.error("Failed to assign permissions:", insertErr.message);
      throw new Error("Failed to update staff permissions");
    }
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "STAFF_PERMISSIONS_UPDATED",
    entity: "admin_permissions",
    entity_id: targetProfileId,
    before: { permissions: existingPermissions },
    after: { permissions: newPermissions },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for staff permissions:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

export async function promoteToAdminStaff(
  targetEmail: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true; profileId: string }> {
  if (adminRole !== "superadmin") {
    throw new Error("Access denied: only superadmin can promote staff");
  }

  const adminClient = createAdminClient();

  const { data: usersData, error: userErr } = await adminClient.auth.admin.listUsers();
  if (userErr || !usersData?.users) {
    throw new Error("Failed to search auth users");
  }

  const targetUser = usersData.users.find(
    (u) => u.email?.toLowerCase() === targetEmail.trim().toLowerCase()
  );

  if (!targetUser) {
    throw new Error("User with this email not found. They must register an account first.");
  }

  const { data: profile, error: findErr } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", targetUser.id)
    .single();

  if (findErr || !profile) {
    throw new Error("User profile not found");
  }

  if (profile.role === "superadmin" || profile.role === "admin_staff") {
    return { success: true, profileId: profile.id };
  }

  const { error: updateErr } = await adminClient
    .from("profiles")
    .update({
      role: "admin_staff",
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (updateErr) {
    console.error("Failed to promote to admin staff:", updateErr.message);
    throw new Error("Failed to promote user to admin staff");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "STAFF_PROMOTED",
    entity: "profiles",
    entity_id: profile.id,
    before: { role: profile.role },
    after: { role: "admin_staff" },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for staff promotion:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true, profileId: profile.id };
}
