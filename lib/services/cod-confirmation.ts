/**
 * Copyright (c) 2026 One Tech and AI. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 * 
 * Cryptographically Secure COD Confirmation Service (Phase 8 - HIGH-04)
 */

import { randomBytes, createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CodTokenResult {
  token: string;
  tokenHash: string;
  expiresAt: string;
  confirmationUrl: string;
}

export interface CodConfirmationResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  status: "confirmed";
  confirmedAt: string;
}

export function generateSecureCodToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashCodToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a single-use cryptographically secure token, hashes it with SHA-256,
 * and attaches it to the order's cod_confirmations record with a 24-hour expiration.
 */
export async function createCodConfirmationToken(params: {
  orderId: string;
  orderNumber: string;
  phone: string;
}): Promise<CodTokenResult> {
  const adminClient = createAdminClient();
  const token = generateSecureCodToken();
  const tokenHash = hashCodToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await adminClient
    .from("cod_confirmations")
    .update({
      token_hash: tokenHash,
      expires_at: expiresAt,
      verified_phone: params.phone,
      status: "pending",
    })
    .eq("order_id", params.orderId);

  if (error) {
    console.error("Failed to update cod_confirmations with token:", error.message);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kaaravan.pk";
  const confirmationUrl = `${baseUrl}/api/v1/orders/confirm-cod?token=${token}`;

  return {
    token,
    tokenHash,
    expiresAt,
    confirmationUrl,
  };
}

/**
 * Validates a single-use token, checks 24-hour expiration, prevents replays,
 * and advances order & sub-orders from awaiting_confirmation to confirmed.
 */
export async function verifyAndConfirmCodOrder(
  token: string,
  ipAddress: string = "system"
): Promise<CodConfirmationResult> {
  if (!token || typeof token !== "string" || token.length < 32) {
    throw new Error("Invalid confirmation token.");
  }

  const adminClient = createAdminClient();
  const tokenHash = createHash("sha256").update(token.trim()).digest("hex");

  // 1. Fetch confirmation record by token hash
  const { data: confirmation, error: confError } = await adminClient
    .from("cod_confirmations")
    .select(`
      id,
      order_id,
      status,
      expires_at,
      token_hash,
      order:orders (
        id,
        order_number,
        payment_method
      )
    `)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (confError || !confirmation) {
    throw new Error("Invalid or unrecognized COD confirmation token.");
  }

  // 2. Check replay attack / single-use
  if (confirmation.status === "confirmed") {
    throw new Error("This confirmation link has already been used. The order is already confirmed.");
  }

  if (confirmation.status === "cancelled") {
    throw new Error("This order has been cancelled and cannot be confirmed.");
  }

  // 3. Check expiration
  if (confirmation.expires_at && new Date(confirmation.expires_at) < new Date()) {
    await adminClient
      .from("cod_confirmations")
      .update({ status: "no_response" })
      .eq("id", confirmation.id);

    throw new Error("This COD confirmation link has expired after 24 hours.");
  }

  const confirmedAt = new Date().toISOString();
  const orderRecord = confirmation.order as unknown as { id: string; order_number: string; payment_method: string };

  // 4. Update cod_confirmations: single use (invalidate token_hash after use)
  const { error: updateConfError } = await adminClient
    .from("cod_confirmations")
    .update({
      status: "confirmed",
      confirmed_at: confirmedAt,
    })
    .eq("id", confirmation.id);

  if (updateConfError) {
    throw new Error(`Failed to update confirmation status: ${updateConfError.message}`);
  }

  // 5. Advance sub_orders from awaiting_confirmation to confirmed
  const { error: subOrderError } = await adminClient
    .from("sub_orders")
    .update({
      status: "confirmed",
      updated_at: confirmedAt,
    })
    .eq("order_id", confirmation.order_id)
    .eq("status", "awaiting_confirmation");

  if (subOrderError) {
    console.error("Failed to advance sub_orders status:", subOrderError.message);
  }

  // 6. Write audit log
  await adminClient.from("audit_logs").insert({
    actor_id: null,
    action: "COD_ORDER_CONFIRMED",
    entity: "orders",
    entity_id: confirmation.order_id,
    before: { status: "awaiting_confirmation", confirmation_id: confirmation.id },
    after: { status: "confirmed", confirmed_at: confirmedAt },
    ip: ipAddress,
  });

  return {
    success: true,
    orderId: confirmation.order_id,
    orderNumber: orderRecord?.order_number || "",
    status: "confirmed",
    confirmedAt,
  };
}

