/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";

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

export async function changeSubOrderStatus(
  subOrderId: string,
  newStatus: SubOrderStatus,
  actorId: string,
  actorRole: "superadmin" | "seller",
  ipAddress: string,
  reason?: string
) {
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

  // State machine validation
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

  if (!validTransitions[oldStatus].includes(newStatus)) {
    throw new Error(`Invalid state transition from ${oldStatus} to ${newStatus}`);
  }

  // Authorization check
  if (actorRole === "seller") {
    // Sellers may only do: pending→confirmed, confirmed→packed, packed→ready_to_ship, and →cancelled before shipped.
    const sellerAllowedTransitions = ["confirmed", "packed", "ready_to_ship", "cancelled"];
    if (!sellerAllowedTransitions.includes(newStatus)) {
      throw new Error(`Sellers cannot change status to ${newStatus}`);
    }

    if (newStatus === "cancelled" && !reason) {
      throw new Error("Reason is required when cancelling an order");
    }

    const { data: seller } = await supabase
      .from("sellers")
      .select("owner_profile_id, status")
      .eq("id", subOrder.seller_id)
      .single();
    
    if (!seller || seller.owner_profile_id !== actorId || seller.status !== "approved") {
      throw new Error("Unauthorized to change this sub-order status");
    }
  }

  // TODO: Courier adapter phase - Handle real tracking logic here

  // Optimistic concurrency update
  const { data: updatedSubOrder, error: updateError } = await supabase
    .from("sub_orders")
    .update({ status: newStatus })
    .eq("id", subOrderId)
    .eq("status", oldStatus)
    .select()
    .maybeSingle();

  if (updateError) {
    throw new Error(`Failed to update status: ${updateError.message}`);
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
    throw new Error(`Failed to append history: ${historyError.message}`);
  }

  // Audit log
  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action: "SUB_ORDER_STATUS_CHANGED",
    entity: "sub_orders",
    entity_id: subOrderId,
    before: { status: oldStatus },
    after: { status: newStatus },
    ip: ipAddress
  });

  if (auditError) {
    throw new Error(`Failed to insert audit log: ${auditError.message}`);
  }

  return { success: true };
}
