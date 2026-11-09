/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import { getPaymentAdapter } from "@/lib/payments";
import type { Database } from "@/lib/types/database";
import { calculateCommissionPkr } from "@/lib/financial/math";
import {
  approveReturnSchema,
  rejectReturnSchema,
  settleRefundDueSchema,
} from "@/lib/validators/admin";

export type ReturnStatus = Database["public"]["Enums"]["return_status"];

export type ActorRole = "superadmin" | "admin_staff";

export interface ApproveReturnParams {
  returnId: string;
  actorId: string;
  actorRole: ActorRole;
  ipAddress: string;
  note?: string;
  customerPayoutDetails?: {
    bankName?: string;
    accountTitle?: string;
    iban?: string;
    phone?: string;
  };
}

export interface ApproveReturnResult {
  success: true;
  returnId: string;
  recalculatedRefundPkr: number;
  reversedCommissionPkr: number;
  recalculatedRefundMinor: number;
  reversedCommissionMinor: number;
  restockedQuantity: number;
  refundType: "online_processed" | "refund_due";
  returnStatus: "approved" | "refunded";
  gatewayRef?: string;
  paymentId?: string;
  subOrderAllReturned: boolean;
}

/**
 * Phase 8 Function 7: Returns & Refunds Processing
 * 
 * CRITICAL FINANCIAL INTEGRITY RULES:
 * 1. Recalculates the refund amount from the database (order_items.unit_price_pkr * quantity).
 *    NEVER trusts the client-provided or previously stored returns.refund_pkr.
 * 2. Reverses seller ledger entries:
 *    - "refund" (-) recalculatedRefundPkr
 *    - "adjustment" (+) reversedCommissionPkr (proportional commission reversed to seller)
 * 3. Restocks physical inventory back to product_variants.stock_quantity.
 * 4. Online payment -> triggers payment gateway adapter refund, marks payment & return refunded.
 * 5. COD / Bank Transfer -> creates a "refund-due" record in payments table, marks return approved.
 */
export async function approveReturnAndRefund(
  params: ApproveReturnParams
): Promise<ApproveReturnResult> {
  const adminClient = createAdminClient();

  // 1. Authorization check
  const hasOrdersPerm = await checkAdminPermission(params.actorId, params.actorRole, "manage_orders");
  const hasFinancePerm = await checkAdminPermission(params.actorId, params.actorRole, "manage_finance");

  if (!hasOrdersPerm && !hasFinancePerm) {
    throw new Error("Access denied: manage_orders or manage_finance permission required");
  }

  approveReturnSchema.parse({
    note: params.note,
    customerPayoutDetails: params.customerPayoutDetails,
  });

  // 2. Fetch return with full database relationships
  const { data: ret, error: retErr } = await adminClient
    .from("returns")
    .select(`
      id,
      order_item_id,
      sub_order_id,
      status,
      quantity,
      refund_pkr,
      reason,
      order_items (
        id,
        variant_id,
        quantity,
        unit_price_pkr,
        line_total_pkr,
        product_title
      ),
      sub_orders (
        id,
        seller_id,
        order_id,
        subtotal_pkr,
        shipping_pkr,
        total_pkr,
        status,
        orders (
          id,
          order_number,
          payment_method,
          payment_status,
          profile_id,
          guest_email,
          guest_phone
        )
      )
    `)
    .eq("id", params.returnId)
    .single();

  if (retErr || !ret) {
    throw new Error(`Return request ${params.returnId} not found`);
  }

  // LOW-01 Concurrency Protection: verify status is strictly requested
  if (ret.status === "refunded") {
    throw new Error("This return has already been processed and refunded");
  }

  if (ret.status === "approved") {
    throw new Error("This return has already been approved");
  }

  if (ret.status === "rejected") {
    throw new Error("Cannot approve a rejected return request");
  }

  if (ret.status !== "requested") {
    throw new Error(`Cannot approve return in '${ret.status}' status`);
  }

  const orderItem = ret.order_items;
  const subOrder = ret.sub_orders;
  const order = subOrder?.orders;

  if (!orderItem || !subOrder || !order) {
    throw new Error("Incomplete relational records for return processing");
  }

  // 3. RECALCULATE REFUND AMOUNT SERVER-SIDE FROM DATABASE (HIGH-01)
  // Non-negotiable Rule 2: Never trust client-submitted or pre-stored refund_pkr
  const returnQuantity = ret.quantity && ret.quantity > 0 ? ret.quantity : 1;
  if (returnQuantity > orderItem.quantity) {
    throw new Error("Return quantity cannot exceed original ordered quantity");
  }

  const recalculatedRefundPkr = orderItem.unit_price_pkr * returnQuantity;

  // 4. Recalculate proportional commission reversal using documented integer formula
  const { data: comm } = await adminClient
    .from("commissions")
    .select("rate_bps")
    .eq("sub_order_id", subOrder.id)
    .maybeSingle();

  const rateBps = comm?.rate_bps ?? 0;
  const reversedCommissionPkr = calculateCommissionPkr(recalculatedRefundPkr, rateBps);

  // 5. Reverse seller ledger entries (balances = sums, strictly append-only, HIGH-03 idempotent event_ids)
  const { data: balanceRows, error: balErr } = await adminClient
    .from("seller_ledger")
    .select("amount_pkr")
    .eq("seller_id", subOrder.seller_id);

  if (balErr) {
    throw new Error("Failed to calculate seller balance for refund reversal");
  }

  const currentBalance = (balanceRows || []).reduce((acc, r) => acc + Number(r.amount_pkr), 0);
  const balanceAfterRefund = currentBalance - recalculatedRefundPkr;
  const balanceAfterAdjustment = balanceAfterRefund + reversedCommissionPkr;

  const nowMs = Date.now();
  const refundTimestamp = new Date(nowMs).toISOString();
  const adjustmentTimestamp = new Date(nowMs + 10).toISOString();

  const ledgerEntries = [
    {
      seller_id: subOrder.seller_id,
      sub_order_id: subOrder.id,
      event_id: `return_${ret.id}_refund`,
      entry_type: "refund" as const,
      amount_pkr: -recalculatedRefundPkr,
      balance_after_pkr: balanceAfterRefund,
      available_at: refundTimestamp,
      created_at: refundTimestamp,
    },
    {
      seller_id: subOrder.seller_id,
      sub_order_id: subOrder.id,
      event_id: `return_${ret.id}_commission_reversal`,
      entry_type: "adjustment" as const,
      amount_pkr: reversedCommissionPkr,
      balance_after_pkr: balanceAfterAdjustment,
      available_at: adjustmentTimestamp,
      created_at: adjustmentTimestamp,
    },
  ];

  const { error: ledgerInsertErr } = await adminClient
    .from("seller_ledger")
    .insert(ledgerEntries);

  if (ledgerInsertErr) {
    console.error("Failed to append refund reversing ledger entries:", ledgerInsertErr.message);
    throw new Error("Failed to record reversing entries on seller ledger");
  }

  // 6. Restock physical inventory
  if (orderItem.variant_id) {
    const { data: variant, error: varErr } = await adminClient
      .from("product_variants")
      .select("id, stock_quantity")
      .eq("id", orderItem.variant_id)
      .single();

    if (!varErr && variant) {
      const restockedStock = variant.stock_quantity + returnQuantity;
      await adminClient
        .from("product_variants")
        .update({
          stock_quantity: restockedStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderItem.variant_id);
    }
  }

  // 7. Refund Execution: Online Payment vs COD / Bank Transfer
  const isCod = order.payment_method === "cod";
  const isBankTransfer = order.payment_method === "bank_transfer";
  const isManualPayout = isCod || isBankTransfer;

  let finalReturnStatus: "approved" | "refunded";
  let gatewayRef: string | undefined;
  let paymentId: string | undefined;

  if (!isManualPayout) {
    // Online Payment: dispatch refund via payment adapter
    const { data: payment } = await adminClient
      .from("payments")
      .select("id, gateway, gateway_ref, amount_pkr, status")
      .eq("order_id", order.id)
      .eq("status", "paid")
      .maybeSingle();

    const gatewayName = payment?.gateway || "mock";
    const gateway = getPaymentAdapter(gatewayName);

    if (!gateway.refund) {
      throw new Error(`Payment gateway ${gatewayName} does not support automated refunds`);
    }

    const gatewayRefund = await gateway.refund({
      orderId: order.id,
      gatewayRef: payment?.gateway_ref || `mock_ref_${order.id}`,
      amountPkr: recalculatedRefundPkr,
      refundAmountPkr: recalculatedRefundPkr,
      refundAmountMinor: recalculatedRefundPkr * 100,
      currency: "PKR",
      reason: params.note || "Customer return approved",
      idempotencyKey: `return_refund_${ret.id}`,
    });

    if (!gatewayRefund.success) {
      throw new Error(`Payment gateway refund failed: ${gatewayRefund.failureReason || "Reversal rejected"}`);
    }

    gatewayRef = gatewayRefund.refundRef;

    if (payment) {
      paymentId = payment.id;
      const isFullRefund = recalculatedRefundPkr >= payment.amount_pkr;
      await adminClient
        .from("payments")
        .update({
          status: isFullRefund ? "refunded" : "partially_refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);
    }

    finalReturnStatus = "refunded";
    await adminClient
      .from("returns")
      .update({
        status: finalReturnStatus,
        refund_pkr: recalculatedRefundPkr,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ret.id);
  } else {
    // COD or Bank Transfer: create a refund-due record in payments table
    const { data: duePayment, error: dueErr } = await adminClient
      .from("payments")
      .insert({
        order_id: order.id,
        method: order.payment_method,
        gateway: order.payment_method,
        amount_pkr: recalculatedRefundPkr,
        status: "pending",
        idempotency_key: `refund_due_${ret.id}`,
        raw_response: {
          type: "refund_due",
          return_id: ret.id,
          customer_payout_details: params.customerPayoutDetails ?? null,
          created_at: new Date().toISOString(),
        },
      })
      .select("id")
      .single();

    if (dueErr) {
      console.error("Failed to insert refund-due payment record:", dueErr.message);
      throw new Error("Failed to record COD refund-due entry");
    }

    paymentId = duePayment.id;
    finalReturnStatus = "approved";

    await adminClient
      .from("returns")
      .update({
        status: finalReturnStatus,
        refund_pkr: recalculatedRefundPkr,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ret.id);
  }

  // 8. Update sub_order status to 'returned' if all items under this sub_order are returned
  const { data: allItems } = await adminClient
    .from("order_items")
    .select("id")
    .eq("sub_order_id", subOrder.id);

  const { data: allReturns } = await adminClient
    .from("returns")
    .select("order_item_id, status")
    .eq("sub_order_id", subOrder.id);

  const completedReturnItemIds = new Set(
    (allReturns || [])
      .filter((r) => r.status === "refunded" || r.status === "approved")
      .map((r) => r.order_item_id)
  );
  completedReturnItemIds.add(ret.order_item_id);

  const subOrderAllReturned = (allItems || []).every((item) => completedReturnItemIds.has(item.id));

  if (subOrderAllReturned) {
    await adminClient
      .from("sub_orders")
      .update({ status: "returned", updated_at: new Date().toISOString() })
      .eq("id", subOrder.id);

    await adminClient.from("order_status_history").insert({
      sub_order_id: subOrder.id,
      from_status: subOrder.status,
      to_status: "returned",
      note: "All items returned and refund processed",
      changed_by: params.actorId,
    });
  }

  // 9. Append audit log
  await adminClient.from("audit_logs").insert({
    actor_id: params.actorId,
    action: "RETURN_AND_REFUND_APPROVED",
    entity: "returns",
    entity_id: ret.id,
    before: {
      status: ret.status,
      requested_refund_pkr: ret.refund_pkr,
    },
    after: {
      recalculated_refund_pkr: recalculatedRefundPkr,
      reversed_commission_pkr: reversedCommissionPkr,
      restocked_quantity: returnQuantity,
      refund_type: isManualPayout ? "refund_due" : "online_processed",
      gateway_ref: gatewayRef ?? null,
      payment_id: paymentId ?? null,
      sub_order_all_returned: subOrderAllReturned,
      note: params.note ?? null,
    },
    ip: params.ipAddress,
  });

  return {
    success: true,
    returnId: ret.id,
    recalculatedRefundPkr,
    reversedCommissionPkr,
    recalculatedRefundMinor: recalculatedRefundPkr,
    reversedCommissionMinor: reversedCommissionPkr,
    restockedQuantity: returnQuantity,
    refundType: isManualPayout ? "refund_due" : "online_processed",
    returnStatus: finalReturnStatus,
    gatewayRef,
    paymentId,
    subOrderAllReturned,
  };
}

/**
 * Rejects a customer return request with a mandatory reason.
 */
export async function rejectReturn(params: {
  returnId: string;
  actorId: string;
  actorRole: ActorRole;
  ipAddress: string;
  reason: string;
}): Promise<{ success: true }> {
  const adminClient = createAdminClient();

  const hasPerm = await checkAdminPermission(params.actorId, params.actorRole, "manage_orders");
  if (!hasPerm) {
    throw new Error("Access denied: manage_orders permission required");
  }

  const validated = rejectReturnSchema.parse({ reason: params.reason });

  const { data: ret, error: fetchErr } = await adminClient
    .from("returns")
    .select("id, status")
    .eq("id", params.returnId)
    .single();

  if (fetchErr || !ret) {
    throw new Error("Return request not found");
  }

  if (ret.status !== "requested") {
    throw new Error(`Cannot reject return in '${ret.status}' status`);
  }

  await adminClient
    .from("returns")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.returnId);

  await adminClient.from("audit_logs").insert({
    actor_id: params.actorId,
    action: "RETURN_REJECTED",
    entity: "returns",
    entity_id: params.returnId,
    before: { status: ret.status },
    after: { status: "rejected", reason: validated.reason },
    ip: params.ipAddress,
  });

  return { success: true };
}

/**
 * Settles a pending COD or Bank Transfer refund-due payment once staff manually
 * executes the bank wire / wallet payout to the customer.
 */
export async function settleRefundDue(params: {
  paymentId: string;
  bankReference: string;
  actorId: string;
  actorRole: ActorRole;
  ipAddress: string;
  note?: string;
}): Promise<{ success: true }> {
  const adminClient = createAdminClient();

  const hasPerm = await checkAdminPermission(params.actorId, params.actorRole, "manage_finance");
  if (!hasPerm) {
    throw new Error("Access denied: manage_finance permission required");
  }

  const validated = settleRefundDueSchema.parse({
    paymentId: params.paymentId,
    bankReference: params.bankReference,
    note: params.note,
  });

  const { data: payment, error: pErr } = await adminClient
    .from("payments")
    .select("id, status, amount_pkr, method, raw_response")
    .eq("id", validated.paymentId)
    .single();

  if (pErr || !payment) {
    throw new Error("Refund-due payment record not found");
  }

  if (payment.status !== "pending") {
    throw new Error(`Payment is not pending settlement (current status: ${payment.status})`);
  }

  const raw = payment.raw_response as { type?: string; return_id?: string } | null;
  if (raw?.type !== "refund_due" || !raw.return_id) {
    throw new Error("Payment record is not a valid refund-due item");
  }

  // 1. Update payment to 'refunded'
  await adminClient
    .from("payments")
    .update({
      status: "refunded",
      gateway_ref: validated.bankReference,
      raw_response: {
        ...raw,
        bank_reference: validated.bankReference,
        settled_at: new Date().toISOString(),
        settled_by: params.actorId,
        note: validated.note ?? null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  // 2. Update matching return to 'refunded'
  await adminClient
    .from("returns")
    .update({
      status: "refunded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", raw.return_id);

  // 3. Audit log
  await adminClient.from("audit_logs").insert({
    actor_id: params.actorId,
    action: "REFUND_DUE_SETTLED",
    entity: "payments",
    entity_id: payment.id,
    before: { status: "pending" },
    after: {
      status: "refunded",
      bank_reference: validated.bankReference,
      return_id: raw.return_id,
      amount_pkr: payment.amount_pkr,
    },
    ip: params.ipAddress,
  });

  return { success: true };
}

/**
 * Returns paginated list of returns with signed URLs for customer uploaded evidence.
 */
export async function listAdminReturns(params: {
  page?: number;
  limit?: number;
  status?: ReturnStatus | "all";
}) {
  const adminClient = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = adminClient
    .from("returns")
    .select(
      `
      id,
      order_item_id,
      sub_order_id,
      reason,
      status,
      quantity,
      refund_pkr,
      evidence_paths,
      created_at,
      updated_at,
      order_items (
        id,
        variant_id,
        quantity,
        unit_price_pkr,
        product_title,
        variant_attributes
      ),
      sub_orders (
        id,
        seller_id,
        sellers (
          business_name
        ),
        orders (
          id,
          order_number,
          payment_method,
          payment_status,
          profile_id,
          guest_email,
          guest_phone
        )
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("Failed to list returns:", error.message);
    throw new Error("Failed to load return requests");
  }

  // Generate signed URLs (valid 5 min) for evidence images
  const itemsWithSignedUrls = await Promise.all(
    (data || []).map(async (row) => {
      const signedEvidenceUrls: string[] = [];
      for (const path of row.evidence_paths || []) {
        const { data: signed } = await adminClient.storage
          .from("return-evidence")
          .createSignedUrl(path, 300);
        if (signed?.signedUrl) {
          signedEvidenceUrls.push(signed.signedUrl);
        }
      }

      return {
        ...row,
        signedEvidenceUrls,
      };
    })
  );

  return {
    returns: itemsWithSignedUrls,
    totalCount: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit) || 1,
  };
}
