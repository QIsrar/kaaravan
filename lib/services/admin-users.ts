/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";

export async function listAdminCustomers(
  adminId: string,
  adminRole: string,
  search?: string
) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_users");
  if (!hasPerm) {
    throw new Error("Access denied: manage_users permission required");
  }

  const adminClient = createAdminClient();

  let query = adminClient
    .from("profiles")
    .select(`
      id,
      full_name,
      phone,
      role,
      status,
      created_at
    `)
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (search && search.trim().length > 0) {
    const s = search.trim().replace(/[,()"]/g, "");
    if (s.length > 0) {
      query = query.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%`);
    }
  }

  const { data: profiles, error } = await query;
  if (error) {
    console.error("Failed to list customers:", error.message);
    throw new Error("Failed to load customer list");
  }

  // Count orders per profile
  const profileIds = (profiles || []).map((p) => p.id);
  const orderCounts: Record<string, number> = {};

  if (profileIds.length > 0) {
    const { data: orders } = await adminClient
      .from("orders")
      .select("profile_id")
      .in("profile_id", profileIds);

    for (const o of orders || []) {
      if (o.profile_id) {
        orderCounts[o.profile_id] = (orderCounts[o.profile_id] || 0) + 1;
      }
    }
  }

  return (profiles || []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    phone: p.phone,
    role: p.role,
    status: p.status,
    createdAt: p.created_at,
    orderCount: orderCounts[p.id] || 0,
  }));
}

export type AdminCustomerListItem = Awaited<ReturnType<typeof listAdminCustomers>>[number];

export async function getAdminCustomerDetail(
  customerId: string,
  adminId: string,
  adminRole: string
) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_users");
  if (!hasPerm) {
    throw new Error("Access denied: manage_users permission required");
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileErr } = await adminClient
    .from("profiles")
    .select("id, full_name, phone, role, status, created_at, updated_at")
    .eq("id", customerId)
    .single();

  if (profileErr || !profile) {
    throw new Error("Customer not found");
  }

  // Fetch customer orders using profile_id
  const { data: orders, error: ordersErr } = await adminClient
    .from("orders")
    .select("id, order_number, total_pkr, payment_method, payment_status, placed_at, shipping_address")
    .eq("profile_id", customerId)
    .order("placed_at", { ascending: false });

  if (ordersErr) {
    console.error("Failed to load customer orders:", ordersErr.message);
  }

  return {
    ...profile,
    orders: orders ?? [],
  };
}

export async function suspendCustomerProfile(
  customerId: string,
  reason: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_users");
  if (!hasPerm) {
    throw new Error("Access denied: manage_users permission required");
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error("Suspension reason is required");
  }

  const adminClient = createAdminClient();

  const { data: before } = await adminClient
    .from("profiles")
    .select("status")
    .eq("id", customerId)
    .single();

  const { error } = await adminClient
    .from("profiles")
    .update({
      status: "suspended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (error) {
    console.error("Failed to suspend customer:", error.message);
    throw new Error("Failed to suspend customer profile");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "CUSTOMER_SUSPENDED",
    entity: "profiles",
    entity_id: customerId,
    before: before || null,
    after: { status: "suspended", reason },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for customer suspension:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

export async function unsuspendCustomerProfile(
  customerId: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_users");
  if (!hasPerm) {
    throw new Error("Access denied: manage_users permission required");
  }

  const adminClient = createAdminClient();

  const { data: before } = await adminClient
    .from("profiles")
    .select("status")
    .eq("id", customerId)
    .single();

  const { error } = await adminClient
    .from("profiles")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (error) {
    console.error("Failed to unsuspend customer:", error.message);
    throw new Error("Failed to reactivate customer profile");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "CUSTOMER_REACTIVATED",
    entity: "profiles",
    entity_id: customerId,
    before: before || null,
    after: { status: "active" },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for customer reactivation:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}
