/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentAdapter } from "@/lib/payments";
import type { WebhookVerificationResult } from "@/lib/payments/types";

export interface PaymentWebhookProcessResult {
  success: boolean;
  message: string;
  isIdempotent?: boolean;
  orderId?: string;
  orderNumber?: string;
  gatewayRef?: string;
  status?: string;
}

/**
 * Dispatches notification stub to merchant that an order is paid and ready to pack.
 */
export function notifySellerOfPaidOrder(params: {
  sellerId: string;
  orderNumber: string;
  subOrderId: string;
}): { delivered: boolean; channel: string } {
  console.info(
    `[Seller Notification Stub] Order ${params.orderNumber} (Sub-order: ${params.subOrderId}) paid. Alerted merchant ${params.sellerId} to begin packing.`
  );
  return { delivered: true, channel: "portal_push_stub" };
}

/**
 * Handles incoming payment gateway webhooks.
 * - Verifies cryptographic HMAC signature (throws 401 if invalid).
 * - Enforces idempotency by checking existing payment records with gatewayRef.
 * - On success: marks payments and orders as paid, confirms sub-orders, deducts stock, and notifies merchants.
 * - On failure: marks payment failed and releases reserved stock back to active inventory.
 */
export async function processPaymentWebhook(
  rawBody: string,
  headers: Record<string, string>,
  options?: { gatewayId?: string }
): Promise<PaymentWebhookProcessResult> {
  const gatewayId = options?.gatewayId || "mock";
  const adapter = getPaymentAdapter(gatewayId);

  // 1. Cryptographically verify webhook signature via adapter
  const verification: WebhookVerificationResult = await adapter.verifyWebhook(rawBody, headers);

  if (!verification.isValid) {
    const error = new Error(verification.failureReason || "Invalid HMAC signature");
    (error as { statusCode?: number }).statusCode = 401;
    throw error;
  }

  const adminClient = createAdminClient();
  const gatewayRef = verification.gatewayRef;

  // 2. Enforce idempotency by gateway_ref
  if (gatewayRef && gatewayRef.trim().length > 0) {
    const { data: existingPayment } = await adminClient
      .from("payments")
      .select("id, order_id, status, gateway_ref")
      .eq("gateway_ref", gatewayRef.trim())
      .maybeSingle();

    if (existingPayment && existingPayment.status === "paid") {
      return {
        success: true,
        message: "Payment webhook already processed (idempotent duplicate)",
        isIdempotent: true,
        orderId: existingPayment.order_id,
        gatewayRef,
        status: "paid",
      };
    }
  }

  // 3. Locate target order
  let orderId = verification.orderId;
  let orderNumber = verification.orderNumber;

  if (!orderId && orderNumber) {
    const { data: foundOrder } = await adminClient
      .from("orders")
      .select("id, order_number, payment_status")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (foundOrder) {
      orderId = foundOrder.id;
      orderNumber = foundOrder.order_number;
    }
  }

  if (!orderId && gatewayRef) {
    // Attempt lookup via payments table
    const { data: foundPayment } = await adminClient
      .from("payments")
      .select("order_id")
      .or(`gateway_ref.eq.${gatewayRef},idempotency_key.eq.${gatewayRef}`)
      .maybeSingle();

    if (foundPayment) {
      orderId = foundPayment.order_id;
    }
  }

  if (!orderId) {
    throw new Error(`Order could not be identified for payment reference: ${gatewayRef}`);
  }

  // Fetch full authoritative order record
  const { data: order, error: orderFetchErr } = await adminClient
    .from("orders")
    .select("id, order_number, payment_status, total_pkr, currency")
    .eq("id", orderId)
    .single();

  if (orderFetchErr || !order) {
    throw new Error(`Order ${orderId} does not exist in the platform.`);
  }

  // Check if order is already marked paid
  if (order.payment_status === "paid") {
    return {
      success: true,
      message: "Order has already been marked paid",
      isIdempotent: true,
      orderId: order.id,
      orderNumber: order.order_number,
      gatewayRef,
      status: "paid",
    };
  }

  // CRIT-03: Webhook Amount and Currency Verification
  if (verification.status === "paid") {
    if (verification.currency && verification.currency.toUpperCase() !== "PKR") {
      throw new Error(
        `Invalid payment currency: expected PKR, received ${verification.currency}`
      );
    }

    if (verification.amountPkr !== undefined && verification.amountPkr !== null) {
      const webhookAmountPkr = Math.round(Number(verification.amountPkr));
      if (webhookAmountPkr !== order.total_pkr) {
        throw new Error(
          `Payment amount mismatch: expected PKR ${order.total_pkr}, received PKR ${webhookAmountPkr}`
        );
      }
    }
  }

  // 4. Process Status Branches
  if (verification.status === "paid") {
    // CRIT-04: Atomic Order Payment Confirmation RPC
    const { data: confirmResult, error: confirmErr } = await adminClient.rpc("confirm_order_payment", {
      p_order_id: order.id,
      p_amount_pkr: order.total_pkr,
      p_currency: "PKR",
      p_gateway: gatewayId,
      p_gateway_ref: gatewayRef || undefined,
      p_idempotency_key: gatewayRef || undefined,
      p_raw_response: verification.rawPayload,
    });

    if (confirmErr) {
      throw new Error(`Failed to confirm payment atomically: ${confirmErr.message}`);
    }

    // Notify Merchants of paid sub-orders
    const resultObj = confirmResult as Record<string, unknown> | null;
    const confirmedSubOrders = resultObj?.sub_orders;
    if (Array.isArray(confirmedSubOrders)) {
      for (const sub of confirmedSubOrders) {
        const subObj = sub as Record<string, unknown>;
        notifySellerOfPaidOrder({
          sellerId: String(subObj.seller_id ?? ""),
          orderNumber: order.order_number,
          subOrderId: String(subObj.sub_order_id ?? ""),
        });
      }
    }

    return {
      success: true,
      message: "Payment successfully verified and order marked paid.",
      orderId: order.id,
      orderNumber: order.order_number,
      gatewayRef,
      status: "paid",
    };
  } else {
    // 4G. Payment Failed or Rejected: release reserved stock
    await adminClient
      .from("payments")
      .update({
        status: "failed",
        gateway_ref: gatewayRef,
        raw_response: verification.rawPayload,
      })
      .eq("order_id", order.id);

    await adminClient
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", order.id);

    // Release reserved inventory
    await adminClient.rpc("release_order_stock", {
      p_order_id: order.id,
      p_reason: verification.failureReason || "Payment declined by gateway",
    });

    return {
      success: true,
      message: "Payment failure recorded and stock released.",
      orderId: order.id,
      orderNumber: order.order_number,
      gatewayRef,
      status: verification.status,
    };
  }
}

export interface SubmitBankTransferProofParams {
  orderId: string;
  filePath: string;
  profileId?: string | null;
  guestEmail?: string | null;
  ipAddress?: string;
}

export async function submitBankTransferProof(
  params: SubmitBankTransferProofParams
): Promise<{ success: true; proofId: string }> {
  const adminClient = createAdminClient();

  // 1. Fetch order
  const { data: order, error: orderErr } = await adminClient
    .from("orders")
    .select("id, profile_id, guest_email, payment_method, payment_status")
    .eq("id", params.orderId)
    .single();

  if (orderErr || !order) {
    throw new Error("Order not found");
  }

  // 2. Authorization check
  if (order.profile_id) {
    if (!params.profileId || params.profileId !== order.profile_id) {
      throw new Error("Unauthorized to submit payment proof for this order");
    }
  } else {
    // Guest order check
    const normalizedParam = (params.guestEmail || "").trim().toLowerCase();
    const normalizedOrder = (order.guest_email || "").trim().toLowerCase();
    if (!normalizedParam || normalizedParam !== normalizedOrder) {
      throw new Error("Unauthorized to submit payment proof for this order");
    }
  }

  // 3. Validate payment method
  if (order.payment_method !== "bank_transfer") {
    throw new Error("Order payment method is not bank transfer");
  }

  // 4. Validate payment status
  if (order.payment_status === "paid") {
    throw new Error("Order has already been marked paid");
  }

  if (order.payment_status === "failed") {
    throw new Error("Cannot submit payment proof for an order with failed payment");
  }

  // 5. Check if there is already a pending proof
  const { data: existingPending } = await adminClient
    .from("bank_transfer_proofs")
    .select("id")
    .eq("order_id", order.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPending) {
    throw new Error("A payment proof is already under review for this order");
  }

  // 6. Insert new proof record
  const { data: inserted, error: insertErr } = await adminClient
    .from("bank_transfer_proofs")
    .insert({
      order_id: order.id,
      file_path: params.filePath,
      status: "pending",
      verified_by: null,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("Failed to insert bank transfer proof:", insertErr?.message);
    throw new Error("Failed to submit bank transfer proof");
  }

  // 7. Audit log
  await adminClient.from("audit_logs").insert({
    actor_id: params.profileId ?? null,
    action: "BANK_TRANSFER_PROOF_SUBMITTED",
    entity: "bank_transfer_proofs",
    entity_id: inserted.id,
    before: null,
    after: {
      order_id: order.id,
      file_path: params.filePath,
    },
    ip: params.ipAddress ?? "unknown",
  });

  return { success: true, proofId: inserted.id };
}

export async function getBankTransferProofForOrder(
  orderId: string,
  profileId?: string | null,
  guestEmail?: string | null
): Promise<{
  id: string;
  orderId: string;
  filePath: string;
  status: string;
  createdAt: string;
  updatedAt: string;
} | null> {
  const adminClient = createAdminClient();

  const { data: order, error: orderErr } = await adminClient
    .from("orders")
    .select("id, profile_id, guest_email")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return null;
  }

  if (order.profile_id) {
    if (!profileId || profileId !== order.profile_id) {
      return null;
    }
  } else {
    const normalizedParam = (guestEmail || "").trim().toLowerCase();
    const normalizedOrder = (order.guest_email || "").trim().toLowerCase();
    if (!normalizedParam || normalizedParam !== normalizedOrder) {
      return null;
    }
  }

  const { data: proof } = await adminClient
    .from("bank_transfer_proofs")
    .select("id, order_id, file_path, status, created_at, updated_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!proof) return null;

  return {
    id: proof.id,
    orderId: proof.order_id,
    filePath: proof.file_path,
    status: proof.status,
    createdAt: proof.created_at,
    updatedAt: proof.updated_at,
  };
}
