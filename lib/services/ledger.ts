/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";

export interface ProcessDeliveryOptions {
  deliveredAt?: string;
  actorId?: string | null;
  ipAddress?: string;
}

export interface ProcessDeliveryResult {
  success: boolean;
  alreadyProcessed: boolean;
  entriesAdded: number;
  finalBalancePkr: number;
  finalBalanceMinor: number;
  availableAt: string;
}

/**
 * Appends immutable ledger entries when a sub-order is delivered:
 * 1. sale (+) subtotal_pkr
 * 2. commission (-) commission_pkr
 * 3. shipping_fee (-) shipping_pkr
 * 
 * available_at = delivered_at + return_window_days.
 * Running balance is strictly monotonic and balances = sums.
 * Idempotent: safe against retries and duplicate events via event_id constraint (HIGH-03).
 */
export async function processSubOrderDelivered(
  subOrderId: string,
  options?: ProcessDeliveryOptions
): Promise<ProcessDeliveryResult> {
  const supabase = createAdminClient();

  // 1. Idempotency check: has a delivery sale entry already been recorded for this sub-order?
  const { data: existingSale } = await supabase
    .from("seller_ledger")
    .select("id, available_at, balance_after_pkr")
    .eq("sub_order_id", subOrderId)
    .eq("event_id", `delivery_${subOrderId}_sale`)
    .maybeSingle();

  if (existingSale) {
    return {
      success: true,
      alreadyProcessed: true,
      entriesAdded: 0,
      finalBalancePkr: existingSale.balance_after_pkr,
      finalBalanceMinor: existingSale.balance_after_pkr,
      availableAt: existingSale.available_at,
    };
  }

  // 2. Fetch sub-order, parent order details, seller return window, and commission snapshot
  const { data: subOrder, error: subErr } = await supabase
    .from("sub_orders")
    .select(`
      id,
      order_id,
      seller_id,
      subtotal_pkr,
      shipping_pkr,
      total_pkr,
      status,
      sellers (
        id,
        return_window_days,
        business_name
      )
    `)
    .eq("id", subOrderId)
    .single();

  if (subErr || !subOrder) {
    throw new Error(`Sub-order ${subOrderId} not found for delivery ledger processing`);
  }

  const { data: commission } = await supabase
    .from("commissions")
    .select("commission_pkr, rate_bps, base_pkr")
    .eq("sub_order_id", subOrderId)
    .maybeSingle();

  // 3. Determine timestamps and return window
  const deliveryDate = options?.deliveredAt ? new Date(options.deliveredAt) : new Date();
  const deliveredAtIso = deliveryDate.toISOString();

  // Return window default: 7 days
  const returnWindowDays = subOrder.sellers?.return_window_days ?? 7;
  const availableAt = new Date(
    deliveryDate.getTime() + returnWindowDays * 24 * 60 * 60 * 1000
  ).toISOString();

  // 4. Calculate current running balance for this seller (balances = sums)
  const { data: balanceRows, error: balErr } = await supabase
    .from("seller_ledger")
    .select("amount_pkr")
    .eq("seller_id", subOrder.seller_id);

  if (balErr) {
    console.error("Failed to query seller balance:", balErr.message);
    throw new Error("Failed to calculate seller balance");
  }

  const currentBalance = (balanceRows || []).reduce(
    (acc, row) => acc + Number(row.amount_pkr),
    0
  );

  const saleAmount = Number(subOrder.subtotal_pkr);
  const commissionAmount = commission ? Number(commission.commission_pkr) : 0;
  const shippingAmount = Number(subOrder.shipping_pkr);

  // Strictly integer whole PKR calculations
  const balanceAfterSale = currentBalance + saleAmount;
  const balanceAfterCommission = balanceAfterSale - commissionAmount;
  const balanceAfterShipping = balanceAfterCommission - shippingAmount;

  // 5. Construct 3 ledger rows with micro-offset timestamps and unique event_ids (HIGH-03)
  const baseTime = deliveryDate.getTime();
  const saleCreatedAt = new Date(baseTime).toISOString();
  const commissionCreatedAt = new Date(baseTime + 10).toISOString();
  const shippingCreatedAt = new Date(baseTime + 20).toISOString();

  const ledgerRows = [
    {
      seller_id: subOrder.seller_id,
      sub_order_id: subOrderId,
      event_id: `delivery_${subOrderId}_sale`,
      entry_type: "sale" as const,
      amount_pkr: saleAmount,
      balance_after_pkr: balanceAfterSale,
      available_at: availableAt,
      created_at: saleCreatedAt,
    },
    {
      seller_id: subOrder.seller_id,
      sub_order_id: subOrderId,
      event_id: `delivery_${subOrderId}_commission`,
      entry_type: "commission" as const,
      amount_pkr: -commissionAmount,
      balance_after_pkr: balanceAfterCommission,
      available_at: availableAt,
      created_at: commissionCreatedAt,
    },
    {
      seller_id: subOrder.seller_id,
      sub_order_id: subOrderId,
      event_id: `delivery_${subOrderId}_shipping`,
      entry_type: "shipping_fee" as const,
      amount_pkr: -shippingAmount,
      balance_after_pkr: balanceAfterShipping,
      available_at: availableAt,
      created_at: shippingCreatedAt,
    },
  ];

  const { error: insertErr } = await supabase
    .from("seller_ledger")
    .insert(ledgerRows);

  if (insertErr) {
    if (insertErr.code === "23505" || insertErr.message.includes("unique")) {
      // Idempotent duplicate handled gracefully
      return {
        success: true,
        alreadyProcessed: true,
        entriesAdded: 0,
        finalBalancePkr: balanceAfterShipping,
        finalBalanceMinor: balanceAfterShipping,
        availableAt,
      };
    }
    console.error("Failed to insert delivery seller ledger entries:", insertErr.message);
    throw new Error("Failed to post delivery transactions to seller ledger");
  }

  // 6. Update shipment if a shipment row exists for this sub_order
  await supabase
    .from("shipments")
    .update({
      delivered_at: deliveredAtIso,
      status: "delivered",
      updated_at: new Date().toISOString(),
    })
    .eq("sub_order_id", subOrderId);

  // 7. Audit log the ledger posting
  await supabase.from("audit_logs").insert({
    actor_id: options?.actorId ?? null,
    action: "SELLER_LEDGER_DELIVERY_POSTED",
    entity: "seller_ledger",
    entity_id: subOrderId,
    before: { current_balance_pkr: currentBalance },
    after: {
      sub_order_id: subOrderId,
      seller_id: subOrder.seller_id,
      sale_pkr: saleAmount,
      commission_pkr: -commissionAmount,
      shipping_pkr: -shippingAmount,
      final_balance_pkr: balanceAfterShipping,
      delivered_at: deliveredAtIso,
      available_at: availableAt,
      return_window_days: returnWindowDays,
    },
    ip: options?.ipAddress ?? "internal",
  });

  return {
    success: true,
    alreadyProcessed: false,
    entriesAdded: ledgerRows.length,
    finalBalancePkr: balanceAfterShipping,
    finalBalanceMinor: balanceAfterShipping,
    availableAt,
  };
}
