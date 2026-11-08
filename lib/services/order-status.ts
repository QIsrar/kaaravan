/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";

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

  return { success: true };
}
