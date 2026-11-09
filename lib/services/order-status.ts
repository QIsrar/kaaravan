/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import { notifyOrderCancellation } from "@/lib/services/notifications";
import { processSubOrderDelivered } from "@/lib/services/ledger";

export type SubOrderStatus = 
  | "awaiting_confirmation"
  | "pending"
  | "confirmed"
  | "packed"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type ActorRole = "superadmin" | "admin_staff" | "seller";

/**
 * Releases reserved stock for a sub-order's items back to active inventory.
 * If the order was already paid, restores physical stock to stock_quantity.
 * If all sub-orders under the parent order are cancelled and unpaid, marks the parent order failed.
 */
export async function releaseSubOrderStock(
  subOrderId: string,
  reason: string,
  actorId: string | null
): Promise<{ releasedItemsCount: number }> {
  const adminClient = createAdminClient();

  // 1. Fetch sub-order, parent order details, and items
  const { data: subOrder, error: subErr } = await adminClient
    .from("sub_orders")
    .select(`
      id,
      order_id,
      seller_id,
      orders (
        id,
        order_number,
        payment_status,
        profile_id,
        guest_email,
        guest_phone
      )
    `)
    .eq("id", subOrderId)
    .single();

  if (subErr || !subOrder || !subOrder.orders) {
    throw new Error("Sub-order not found for stock release");
  }

  const { data: items, error: itemsErr } = await adminClient
    .from("order_items")
    .select("id, variant_id, quantity")
    .eq("sub_order_id", subOrderId);

  if (itemsErr || !items || items.length === 0) {
    return { releasedItemsCount: 0 };
  }

  const order = subOrder.orders;
  const isPaid = order.payment_status === "paid";

  // 2. Adjust product variants stock
  for (const item of items) {
    if (!item.variant_id) continue;

    const { data: variant, error: varErr } = await adminClient
      .from("product_variants")
      .select("id, stock_quantity, reserved_quantity")
      .eq("id", item.variant_id)
      .single();

    if (varErr || !variant) continue;

    if (isPaid) {
      // If paid, stock was deducted from stock_quantity; restore it back to stock_quantity
      const newStock = variant.stock_quantity + item.quantity;
      await adminClient
        .from("product_variants")
        .update({
          stock_quantity: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.variant_id);
    } else {
      // If unpaid, stock was reserved in reserved_quantity; release it from reserved_quantity
      const newReserved = Math.max(0, variant.reserved_quantity - item.quantity);
      await adminClient
        .from("product_variants")
        .update({
          reserved_quantity: newReserved,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.variant_id);
    }
  }

  // 3. Check parent order status: if ALL sub-orders are now cancelled
  const { data: allSubOrders } = await adminClient
    .from("sub_orders")
    .select("id, status")
    .eq("order_id", subOrder.order_id);

  const allCancelled = (allSubOrders || []).every((s) => s.status === "cancelled");

  if (allCancelled && !isPaid) {
    await adminClient
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", subOrder.order_id);
  }

  // 4. Log stock release audit
  await adminClient.from("audit_logs").insert({
    actor_id: actorId,
    action: "SUB_ORDER_STOCK_RELEASED",
    entity: "sub_orders",
    entity_id: subOrderId,
    before: { order_id: subOrder.order_id },
    after: {
      reason,
      is_paid: isPaid,
      items_count: items.length,
      all_sub_orders_cancelled: allCancelled,
    },
    ip: "internal",
  });

  return { releasedItemsCount: items.length };
}

export async function changeSubOrderStatus(
  subOrderId: string,
  newStatus: SubOrderStatus,
  actorId: string,
  actorRole: ActorRole,
  ipAddress: string,
  reason?: string
): Promise<{ success: true }> {
  const supabase = createAdminClient();

  // Fetch current sub order
  const { data: subOrder, error: fetchError } = await supabase
    .from("sub_orders")
    .select("id, status, seller_id, order_id")
    .eq("id", subOrderId)
    .single();

  if (fetchError || !subOrder) {
    throw new Error("Sub order not found");
  }

  const oldStatus = subOrder.status as SubOrderStatus;

  if (oldStatus === newStatus) {
    return { success: true };
  }

  const isAdmin = actorRole === "superadmin" || actorRole === "admin_staff";

  // Authorization check
  if (isAdmin) {
    const hasPerm = await checkAdminPermission(actorId, actorRole, "manage_orders");
    if (!hasPerm) {
      throw new Error("Access denied: manage_orders permission required");
    }
    // Mandatory note required for all admin force changes and force cancellations
    if (!reason || reason.trim().length === 0) {
      throw new Error("A mandatory note explaining this admin status modification is required");
    }
  } else if (actorRole === "seller") {
    // State machine validation for regular seller actions
    const validTransitions: Record<SubOrderStatus, SubOrderStatus[]> = {
      "awaiting_confirmation": ["pending", "cancelled"],
      "pending": ["confirmed", "cancelled"],
      "confirmed": ["packed", "cancelled"],
      "packed": ["ready_to_ship", "cancelled"],
      "ready_to_ship": ["shipped", "cancelled"],
      "shipped": ["delivered", "returned"],
      "delivered": ["returned"],
      "cancelled": [],
      "returned": []
    };

    if (!validTransitions[oldStatus]?.includes(newStatus)) {
      throw new Error(`Invalid state transition from ${oldStatus} to ${newStatus}`);
    }

    const sellerAllowedTransitions = ["confirmed", "packed", "ready_to_ship", "cancelled"];
    if (!sellerAllowedTransitions.includes(newStatus)) {
      throw new Error(`Sellers cannot change status to ${newStatus}`);
    }

    if (newStatus === "cancelled") {
      if (!["awaiting_confirmation", "pending", "confirmed"].includes(oldStatus)) {
        throw new Error("Sellers can only cancel orders before they are packed");
      }
      if (!reason) {
        throw new Error("Reason is required when cancelling an order");
      }
    }

    const { data: seller } = await supabase
      .from("sellers")
      .select("owner_profile_id, status")
      .eq("id", subOrder.seller_id)
      .single();
    
    if (!seller || seller.owner_profile_id !== actorId || seller.status !== "approved") {
      throw new Error("Unauthorized to change this sub-order status");
    }
  } else {
    throw new Error("Unauthorized role for sub-order status change");
  }

  // Optimistic concurrency update
  const { data: updatedSubOrder, error: updateError } = await supabase
    .from("sub_orders")
    .update({ status: newStatus })
    .eq("id", subOrderId)
    .eq("status", oldStatus)
    .select()
    .maybeSingle();

  if (updateError) {
    console.error(`Failed to update status: ${updateError.message}`);
    throw new Error("Failed to update status");
  }

  if (!updatedSubOrder) {
    throw new Error("Order status changed, please refresh");
  }

  // Append history
  const { error: historyError } = await supabase.from("order_status_history").insert({
    sub_order_id: subOrderId,
    from_status: oldStatus,
    to_status: newStatus,
    note: reason || null,
    changed_by: actorId
  });

  if (historyError) {
    console.error(`Failed to append history: ${historyError.message}`);
    throw new Error("Failed to append history");
  }

  // Audit log
  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action: isAdmin ? "ADMIN_SUB_ORDER_STATUS_OVERRIDE" : "SUB_ORDER_STATUS_CHANGED",
    entity: "sub_orders",
    entity_id: subOrderId,
    before: { status: oldStatus },
    after: { status: newStatus, note: reason ?? null },
    ip: ipAddress
  });

  if (auditError) {
    console.error(`Failed to insert audit log: ${auditError.message}`);
    throw new Error("Failed to log action");
  }

  // If status is delivered, append sale (+), commission (-), shipping_fee (-) to seller_ledger
  if (newStatus === "delivered") {
    await processSubOrderDelivered(subOrderId, {
      actorId,
      ipAddress,
    });
  }

  // If status is cancelled, release reserved stock and dispatch notification
  if (newStatus === "cancelled") {
    await releaseSubOrderStock(subOrderId, reason || "Order cancelled", actorId);

    const { data: parentOrder } = await supabase
      .from("orders")
      .select("order_number, profile_id, guest_email, guest_phone")
      .eq("id", subOrder.order_id)
      .single();

    if (parentOrder) {
      await notifyOrderCancellation({
        orderNumber: parentOrder.order_number,
        subOrderId,
        sellerId: subOrder.seller_id,
        customerProfileId: parentOrder.profile_id,
        customerEmail: parentOrder.guest_email,
        customerPhone: parentOrder.guest_phone,
        cancelledBy: isAdmin ? "admin" : "seller",
        reason: reason || "Order cancelled",
      });
    }
  }

  return { success: true };
}
