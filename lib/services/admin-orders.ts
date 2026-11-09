/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import { changeSubOrderStatus, type SubOrderStatus, type ActorRole } from "./order-status";
import { notifyOrderCancellation } from "./notifications";

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
      subtotal_pkr,
      shipping_pkr,
      total_pkr,
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
        unit_price_pkr,
        line_total_pkr
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
      subtotal_pkr,
      shipping_pkr,
      total_pkr,
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
        unit_price_pkr,
        line_total_pkr
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

export async function adminCancelFullOrder(
  orderId: string,
  reason: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true; orderId: string; orderNumber: string }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_orders");
  if (!hasPerm) {
    throw new Error("Access denied: manage_orders permission required");
  }

  if (!reason || reason.trim().length < 5) {
    throw new Error("A mandatory cancellation note of at least 5 characters is required");
  }

  const adminClient = createAdminClient();

  // 1. Fetch order
  const { data: order, error: orderErr } = await adminClient
    .from("orders")
    .select("id, order_number, payment_status, profile_id, guest_email, guest_phone")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    throw new Error("Order not found");
  }

  if (order.payment_status === "failed") {
    throw new Error("Order is already cancelled or failed");
  }

  const isPaid = order.payment_status === "paid";

  // 2. Fetch all sub-orders and their items
  const { data: subOrders, error: subOrdersErr } = await adminClient
    .from("sub_orders")
    .select("id, seller_id, status")
    .eq("order_id", order.id);

  if (subOrdersErr) {
    throw new Error(`Failed to retrieve sub-orders: ${subOrdersErr.message}`);
  }

  // 3. If paid, physical stock was deducted from stock_quantity; restore it
  if (isPaid && subOrders && subOrders.length > 0) {
    const subOrderIds = subOrders.map((s) => s.id);
    const { data: items } = await adminClient
      .from("order_items")
      .select("variant_id, quantity")
      .in("sub_order_id", subOrderIds);

    if (items) {
      for (const item of items) {
        if (!item.variant_id) continue;
        const { data: variant } = await adminClient
          .from("product_variants")
          .select("id, stock_quantity")
          .eq("id", item.variant_id)
          .single();

        if (variant) {
          await adminClient
            .from("product_variants")
            .update({
              stock_quantity: variant.stock_quantity + item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.variant_id);
        }
      }
    }
  }

  // 4. Release reserved stock & cancel all sub-orders atomically via release_order_stock RPC
  const { error: releaseErr } = await adminClient.rpc("release_order_stock", {
    p_order_id: order.id,
    p_reason: `Admin cancelled order: ${reason}`,
    p_actor_id: adminId,
  });

  if (releaseErr) {
    console.error("release_order_stock RPC error:", releaseErr.message);
  }

  // 5. Update order payment_status if unpaid
  if (!isPaid) {
    await adminClient
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", order.id);

    await adminClient
      .from("payments")
      .update({
        status: "failed",
        raw_response: {
          cancelled_by: adminId,
          reason,
          cancelled_at: new Date().toISOString(),
        },
      })
      .eq("order_id", order.id);
  }

  // 6. Record status history on all sub-orders
  if (subOrders && subOrders.length > 0) {
    const historyRows = subOrders.map((sub) => ({
      sub_order_id: sub.id,
      from_status: sub.status,
      to_status: "cancelled" as const,
      note: `Full order cancelled by platform admin: ${reason}`,
      changed_by: adminId,
    }));

    await adminClient.from("order_status_history").insert(historyRows);

    // 7. Dispatch notification stubs to all merchants and customer
    for (const sub of subOrders) {
      await notifyOrderCancellation({
        orderNumber: order.order_number,
        subOrderId: sub.id,
        sellerId: sub.seller_id,
        customerProfileId: order.profile_id,
        customerEmail: order.guest_email,
        customerPhone: order.guest_phone,
        cancelledBy: "admin",
        reason,
      });
    }
  }

  // 8. Log audit log
  await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "ADMIN_FULL_ORDER_CANCELLED",
    entity: "orders",
    entity_id: order.id,
    before: { payment_status: order.payment_status },
    after: {
      payment_status: isPaid ? order.payment_status : "failed",
      reason,
      ip: ipAddress,
    },
    ip: ipAddress,
  });

  return { success: true, orderId: order.id, orderNumber: order.order_number };
}

