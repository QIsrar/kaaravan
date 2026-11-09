/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseSubOrderStock } from "@/lib/services/order-status";
import { notifyOrderCancellation } from "@/lib/services/notifications";

export async function getCustomerOrders(supabase: SupabaseClient<Database>, profileId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, profile_id, guest_email, subtotal_pkr, shipping_pkr, total_pkr, currency, shipping_address, billing_address, payment_method, payment_status, placed_at,
      sub_orders (
        id, order_id, seller_id, status, subtotal_pkr, shipping_pkr, total_pkr, created_at, updated_at,
        order_items (
          id, sub_order_id, variant_id, product_title, variant_attributes, unit_price_pkr, quantity, line_total_pkr, created_at,
          product_variants (
            id, sku, price_pkr, compare_at_pkr, attributes,
            products (id, title, slug, product_images (path))
          )
        ),
        sellers (business_name, logo)
      )
    `)
    .eq("profile_id", profileId)
    .order("placed_at", { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getCustomerOrderDetails(supabase: SupabaseClient<Database>, profileId: string, orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, profile_id, guest_email, subtotal_pkr, shipping_pkr, total_pkr, currency, shipping_address, billing_address, payment_method, payment_status, placed_at,
      sub_orders (
        id, order_id, seller_id, status, subtotal_pkr, shipping_pkr, total_pkr, created_at, updated_at,
        order_items (
          id, sub_order_id, variant_id, product_title, variant_attributes, unit_price_pkr, quantity, line_total_pkr, created_at,
          product_variants (
            id, sku, price_pkr, compare_at_pkr, attributes,
            products (id, title, slug, product_images (path))
          )
        ),
        sellers (business_name, logo, return_window_days),
        order_status_history (id, from_status, to_status, note, created_at),
        returns (id, order_item_id, reason, status, quantity, refund_pkr, evidence_paths, created_at)
      )
    `)
    .eq("profile_id", profileId)
    .eq("id", orderId)
    .single();
  
  if (error) throw error;
  return data;
}

export interface PublicTrackOrderItem {
  product_title: string;
  quantity: number;
}

export interface PublicTrackStatusHistory {
  to_status: string;
  created_at: string;
}

export interface PublicTrackSubOrder {
  seller_business_name: string;
  status: Database["public"]["Enums"]["sub_order_status"];
  order_status_history: PublicTrackStatusHistory[];
  items: PublicTrackOrderItem[];
}

export interface PublicTrackOrder {
  order_number: string;
  placed_at: string;
  sub_orders: PublicTrackSubOrder[];
}

export async function lookupGuestOrder(
  supabaseAdmin: SupabaseClient<Database>,
  orderNumber: string,
  email: string
): Promise<PublicTrackOrder> {
  const normalizedEmail = email.trim().toLowerCase();
  
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(`
      order_number, profile_id, guest_email, placed_at,
      sub_orders (
        status,
        order_items (
          product_title, quantity
        ),
        sellers (business_name),
        order_status_history (to_status, created_at)
      )
    `)
    .eq("order_number", orderNumber)
    .single();
  
  if (error || !data) throw new Error("Order not found");

  let matches = false;
  if (data.guest_email && data.guest_email.toLowerCase() === normalizedEmail) {
    matches = true;
  } else if (data.profile_id) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(data.profile_id);
    if (userData?.user?.email?.toLowerCase() === normalizedEmail) {
      matches = true;
    }
  }

  if (!matches) {
    throw new Error("Order not found");
  }

  return {
    order_number: data.order_number,
    placed_at: data.placed_at,
    sub_orders: (data.sub_orders || []).map((sub) => ({
      seller_business_name: sub.sellers?.business_name || "Seller",
      status: sub.status,
      order_status_history: (sub.order_status_history || [])
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .map((h) => ({
          to_status: h.to_status,
          created_at: h.created_at,
        })),
      items: (sub.order_items || []).map((item) => ({
        product_title: item.product_title,
        quantity: item.quantity,
      })),
    })),
  };
}

export async function cancelSubOrder(supabase: SupabaseClient<Database>, profileId: string, subOrderId: string, reason: string) {
  const { data: subOrder, error: fetchErr } = await supabase
    .from("sub_orders")
    .select(`
      id,
      seller_id,
      status,
      order_id,
      orders!inner (
        id,
        order_number,
        profile_id,
        guest_email,
        guest_phone,
        payment_status
      )
    `)
    .eq("id", subOrderId)
    .single();

  if (fetchErr || !subOrder || !subOrder.orders) {
    throw new Error("Sub-order not found");
  }

  const parentOrder = subOrder.orders;
  if (parentOrder.profile_id !== profileId) {
    throw new Error("Unauthorized");
  }

  if (!["awaiting_confirmation", "pending", "confirmed"].includes(subOrder.status)) {
    throw new Error("Order cannot be cancelled after packing. Contact support.");
  }

  const adminClient = createAdminClient();

  const { data: updatedData, error: updateErr } = await adminClient
    .from("sub_orders")
    .update({ status: "cancelled" })
    .eq("id", subOrderId)
    .eq("status", subOrder.status)
    .select();
  
  if (updateErr) throw updateErr;
  if (!updatedData || updatedData.length === 0) {
    throw new Error("Order status changed, please refresh");
  }

  // Insert status history
  const { error: historyErr } = await adminClient
    .from("order_status_history")
    .insert({
      sub_order_id: subOrderId,
      from_status: subOrder.status as Database["public"]["Enums"]["sub_order_status"],
      to_status: "cancelled",
      note: `Cancelled by customer. Reason: ${reason}`,
      changed_by: profileId
    });

  if (historyErr) throw historyErr;

  // Insert audit log
  const { error: auditErr } = await adminClient.from("audit_logs").insert({
    actor_id: profileId,
    action: "cancel_sub_order",
    entity: "sub_orders",
    entity_id: subOrderId,
    before: { status: subOrder.status },
    after: { status: "cancelled", reason }
  });
  
  if (auditErr) throw auditErr;

  // Release reserved stock back to active inventory
  await releaseSubOrderStock(subOrderId, `Cancelled by customer: ${reason}`, profileId);

  // Notify seller of cancellation
  await notifyOrderCancellation({
    orderNumber: parentOrder.order_number,
    subOrderId,
    sellerId: subOrder.seller_id,
    customerProfileId: profileId,
    customerEmail: parentOrder.guest_email,
    customerPhone: parentOrder.guest_phone,
    cancelledBy: "customer",
    reason,
  });
}

export async function requestReturn(
  supabase: SupabaseClient<Database>,
  profileId: string,
  subOrderId: string,
  orderItemId: string,
  reason: string,
  quantity: number,
  evidenceFiles: File[] = []
) {
  // Validate ownership and return window
  const { data: subOrder, error: fetchErr } = await supabase
    .from("sub_orders")
    .select(`
      status, 
      seller_id,
      orders!inner(profile_id),
      sellers!inner(return_window_days),
      order_status_history (to_status, created_at),
      order_items (id, unit_price_pkr, quantity, sub_order_id)
    `)
    .eq("id", subOrderId)
    .single();
  if (fetchErr) throw fetchErr;

  const orderProfileId = (subOrder.orders as unknown as { profile_id: string }).profile_id;
  if (orderProfileId !== profileId) throw new Error("Unauthorized");

  if (subOrder.status !== "delivered") {
    throw new Error("Only delivered items can be returned");
  }

  const orderItem = (subOrder.order_items as Array<{ id: string; unit_price_pkr: number; quantity: number }>).find(item => item.id === orderItemId);
  if (!orderItem) {
    throw new Error("Order item does not belong to this order");
  }

  if (quantity <= 0 || quantity > orderItem.quantity) {
    throw new Error("Invalid return quantity");
  }

  const deliveredHistory = (subOrder.order_status_history as Array<{ to_status: string, created_at: string }>).find(h => h.to_status === "delivered");
  if (!deliveredHistory) {
    throw new Error("Delivery history not found");
  }

  const returnWindowDays = (subOrder.sellers as unknown as { return_window_days: number }).return_window_days || 7;
  const deliveredAt = new Date(deliveredHistory.created_at);
  const deadline = new Date(deliveredAt.getTime() + returnWindowDays * 24 * 60 * 60 * 1000);
  
  if (new Date() > deadline) {
    throw new Error(`The return window for this order closed on ${deadline.toLocaleDateString()}`);
  }

  const adminClient = createAdminClient();

  // Validate cumulative return quantities (HIGH-01)
  const { data: existingReturns } = await adminClient
    .from("returns")
    .select("quantity, status")
    .eq("order_item_id", orderItemId);
  
  const activeReturns = (existingReturns || []).filter(r => r.status !== 'rejected');
  const alreadyReturnedQty = activeReturns.reduce((sum, r) => sum + (r.quantity || 0), 0);

  if (alreadyReturnedQty + quantity > orderItem.quantity) {
    throw new Error(
      `Cannot return ${quantity} items. ${alreadyReturnedQty} of ${orderItem.quantity} already requested/returned.`
    );
  }

  // Handle evidence files
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const evidencePaths: string[] = [];
  const returnId = crypto.randomUUID(); 

  for (const file of evidenceFiles) {
    if (!file || file.size === 0 || !file.name) continue;
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.name}`);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`File too large (max 5MB): ${file.name}`);
    }

    const ext = file.name.split('.').pop() || 'tmp';
    const uuid = crypto.randomUUID();
    const path = `${profileId}/${subOrder.seller_id}/${returnId}/${uuid}.${ext}`;
    
    const { error: uploadError } = await adminClient.storage
      .from("return-evidence")
      .upload(path, file);
    
    if (uploadError) {
      throw new Error(`Failed to upload evidence: ${uploadError.message}`);
    }
    evidencePaths.push(path);
  }

  // Authoritative recalculated PKR amount for requested snapshot
  const refundPkr = orderItem.unit_price_pkr * quantity;

  const { error: insertErr } = await adminClient
    .from("returns")
    .insert({
      id: returnId,
      order_item_id: orderItemId,
      sub_order_id: subOrderId,
      reason,
      status: "requested",
      quantity,
      refund_pkr: refundPkr,
      evidence_paths: evidencePaths
    });
  
  if (insertErr) throw insertErr;

  const { error: auditErr } = await adminClient.from("audit_logs").insert({
    actor_id: profileId,
    action: "request_return",
    entity: "returns",
    entity_id: returnId,
    after: { order_item_id: orderItemId, quantity, refund_pkr: refundPkr }
  });
  if (auditErr) throw auditErr;
}
