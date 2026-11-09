/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { NextRequest, NextResponse } from "next/server";
import { processPaymentWebhook } from "@/lib/services/payments";

/**
 * POST /api/webhooks/payments
 * Inbound payment gateway webhook handler.
 * Verifies cryptographic HMAC signatures (returns 401 on failure),
 * enforces idempotency by gateway_ref, marks orders paid, permanently
 * deducts inventory stock, and notifies merchants.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!rawBody || rawBody.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Empty webhook payload" },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const gatewayId =
      req.nextUrl.searchParams.get("gateway") ||
      headers["x-gateway"] ||
      "mock";

    const result = await processPaymentWebhook(rawBody, headers, { gatewayId });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const statusCode = err.statusCode === 401 ? 401 : 400;
    const message = err.message || "Webhook processing failed";

    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}
