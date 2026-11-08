/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import { changeSubOrderStatus, type SubOrderStatus, type ActorRole } from "./order-status";

export async function adminForceSubOrderStatus(
  subOrderId: string,
  newStatus: SubOrderStatus,
  note: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_orders");
  if (!hasPerm) {
    throw new Error("Access denied: manage_orders permission required");
  }

  return changeSubOrderStatus(
    subOrderId,
    newStatus,
    adminId,
    adminRole as ActorRole,
    ipAddress,
    note
  );
}

export async function listAdminSubOrders(
  adminId: string,
  adminRole: string,
  filters?: { status?: SubOrderStatus; sellerId?: string }
) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_orders");
  if (!hasPerm) {
    throw new Error("Access denied: manage_orders permission required");
  }

  const adminClient = createAdminClient();

  let query = adminClient
    .from("sub_orders")
    .select(`
      id,
      order_id,
      seller_id,
      status,
      subtotal_minor,
      shipping_minor,
      total_minor,
      created_at,
      updated_at,
      sellers (
        business_name,
        slug
      ),
      orders (
        order_number,
        payment_method,
        payment_status,
        placed_at,
        shipping_address
      ),
      order_items (
        id,
        product_title,
        quantity,
        unit_price_minor,
        line_total_minor
      )
    `)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.sellerId) {
    query = query.eq("seller_id", filters.sellerId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to list admin sub orders:", error.message);
    throw new Error("Failed to load orders");
  }

  return data ?? [];
}

export type AdminSubOrderListItem = Awaited<ReturnType<typeof listAdminSubOrders>>[number];

export async function getAdminSubOrderDetail(
  subOrderId: string,
  adminId: string,
  adminRole: string
) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_orders");
  if (!hasPerm) {
    throw new Error("Access denied: manage_orders permission required");
  }

  const adminClient = createAdminClient();

  const { data: subOrder, error: subOrderErr } = await adminClient
    .from("sub_orders")
    .select(`
      id,
      order_id,
      seller_id,
      status,
      subtotal_minor,
      shipping_minor,
      total_minor,
      created_at,
      updated_at,
      sellers (
        id,
        business_name,
        slug
      ),
      orders (
        id,
        order_number,
        payment_method,
        payment_status,
        placed_at,
        shipping_address,
        profile_id,
        profiles:profile_id (
          id,
          full_name,
          phone
        )
      ),
      order_items (
        id,
        product_title,
        quantity,
        unit_price_minor,
        line_total_minor
      ),
      shipments (
        id,
        courier_code,
        tracking_number,
        status,
        booked_at,
        delivered_at
      )
    `)
    .eq("id", subOrderId)
    .single();

  if (subOrderErr || !subOrder) {
    console.error("Failed to fetch admin sub order detail:", subOrderErr?.message);
    throw new Error("Sub order not found");
  }

  // Fetch timeline from order_status_history
  const { data: history, error: historyErr } = await adminClient
    .from("order_status_history")
    .select(`
      id,
      from_status,
      to_status,
      note,
      created_at,
      changed_by,
      profiles:changed_by (
        full_name,
        role
      )
    `)
    .eq("sub_order_id", subOrderId)
    .order("created_at", { ascending: true });

  if (historyErr) {
    console.error("Failed to fetch order history:", historyErr.message);
  }

  return {
    ...subOrder,
    history: history ?? [],
  };
}

