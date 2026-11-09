/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Json } from "@/lib/types/database";
import type {
  PaymentGatewayAdapter,
  CreatePaymentSessionParams,
  PaymentSessionResult,
  WebhookVerificationResult,
  PaymentStatusResult,
  PaymentRefundParams,
  PaymentRefundResult,
} from "./types";

/**
 * Mock Payment Gateway Adapter
 * Simulates Pakistani payment rails (JazzCash, EasyPaisa, Card) with deterministic scenarios:
 * - Amount ending in 00 paisa -> Success (succeeded / paid)
 * - Amount ending in 01 paisa -> Failed
 * - Amount ending in 02 paisa -> Rejected
 * - Or dynamically controlled via custom headers / scenario overrides.
 */
export class MockGateway implements PaymentGatewayAdapter {
  public readonly id = "mock";
  public readonly displayName = "Kaaravan Mock Payment Rail (JazzCash / EasyPaisa / Card)";

  private readonly webhookSecret: string;

  constructor(secret?: string) {
    this.webhookSecret = secret || process.env.PAYMENT_WEBHOOK_SECRET || "mock_kaaravan_webhook_secret_2026";
  }

  /**
   * Generates a valid HMAC-SHA256 signature for test webhook delivery.
   */
  public generateWebhookSignature(payload: string): string {
    return createHmac("sha256", this.webhookSecret).update(payload).digest("hex");
  }

  /**
   * Initializes a mock payment session.
   */
  public async createPaymentSession(
    params: CreatePaymentSessionParams
  ): Promise<PaymentSessionResult> {
    const amountPkr = params.amountPkr ?? (params.amountMinor ? Math.floor(params.amountMinor / 100) : 0);
    const lastDigits = Math.abs(amountPkr % 100);
    const scenario = params.scenarioOverride;

    let status: PaymentSessionResult["status"] = "pending";

    if (scenario === "failure" || lastDigits === 1) {
      status = "failed";
    } else if (scenario === "rejected" || lastDigits === 2) {
      status = "rejected";
    }

    const gatewayRef = `mock_${params.method}_${params.orderNumber}_${Date.now()}_${lastDigits.toString().padStart(2, "0")}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kaaravan.pk";
    const sessionUrl = `${baseUrl}/mock-gateway/pay?ref=${gatewayRef}&orderId=${params.orderId}&amount=${amountPkr}&method=${params.method}`;

    return {
      sessionUrl,
      gatewayRef,
      status,
      clientSecret: `cs_mock_${params.orderId}_${Date.now()}`,
      rawResponse: {
        gateway: "mock",
        simulatedMethod: params.method,
        orderId: params.orderId,
        amountPkr,
        currency: params.currency,
        status,
      },
    };
  }

  /**
   * Verifies an incoming webhook signature using timing-safe comparison
   * and deterministically resolves the payment state.
   */
  public async verifyWebhook(
    payload: string | Record<string, unknown>,
    headers: Record<string, string>
  ): Promise<WebhookVerificationResult> {
    const rawBody = typeof payload === "string" ? payload : JSON.stringify(payload);
    
    // Normalize header lookup
    const signatureHeader =
      headers["x-signature"] ||
      headers["x-mock-signature"] ||
      headers["x-kaaravan-signature"] ||
      "";

    // 1. Verify HMAC signature
    const expectedSignature = this.generateWebhookSignature(rawBody);
    const sigBuffer = Buffer.from(signatureHeader, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    const isSignatureValid =
      sigBuffer.length === expectedBuffer.length && timingSafeEqual(sigBuffer, expectedBuffer);

    let parsed: Json = {};
    try {
      parsed = typeof payload === "string" ? JSON.parse(payload) : (payload as Json);
    } catch {
      parsed = { raw: rawBody };
    }

    const obj: Record<string, Json | undefined> =
      typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, Json | undefined>)
        : {};

    const amountPkr = typeof obj.amountPkr === "number"
      ? obj.amountPkr
      : typeof obj.amount_pkr === "number"
      ? obj.amount_pkr
      : typeof obj.amountMinor === "number"
      ? Math.floor(obj.amountMinor / 100)
      : typeof obj.amount === "number"
      ? obj.amount
      : 0;

    if (!isSignatureValid) {
      return {
        isValid: false,
        gatewayRef: String(obj.gatewayRef ?? obj.gateway_ref ?? ""),
        orderId: typeof obj.orderId === "string" ? obj.orderId : undefined,
        orderNumber: typeof obj.orderNumber === "string" ? obj.orderNumber : undefined,
        amountPkr,
        amountMinor: amountPkr * 100,
        currency: typeof obj.currency === "string" ? obj.currency : "PKR",
        status: "failed",
        failureReason: "Invalid HMAC signature header",
        rawPayload: parsed,
      };
    }

    // 2. Parse scenario from amount or header override
    const headerOverride = headers["x-mock-status"] || headers["x-mock-scenario"];
    const lastDigits = Math.abs(amountPkr % 100);

    let status: WebhookVerificationResult["status"] = "paid";
    let failureReason: string | undefined = undefined;

    if (headerOverride === "failed" || headerOverride === "failure" || lastDigits === 1) {
      status = "failed";
      failureReason = "Simulated transaction decline by issuer";
    } else if (headerOverride === "rejected" || lastDigits === 2) {
      status = "rejected";
      failureReason = "Simulated merchant risk rejection";
    }

    const gatewayRef = String(obj.gatewayRef ?? obj.gateway_ref ?? `mock_wh_${Date.now()}`);

    return {
      isValid: true,
      gatewayRef,
      orderId: typeof obj.orderId === "string" ? obj.orderId : undefined,
      orderNumber: typeof obj.orderNumber === "string" ? obj.orderNumber : undefined,
      amountPkr,
      amountMinor: amountPkr * 100,
      currency: typeof obj.currency === "string" ? obj.currency : "PKR",
      status,
      failureReason,
      rawPayload: parsed,
    };
  }

  /**
   * Queries status for a transaction.
   */
  public async getStatus(gatewayRef: string, transactionId?: string): Promise<PaymentStatusResult> {
    void transactionId;
    const isFailed = gatewayRef.endsWith("01");
    const isRejected = gatewayRef.endsWith("02");

    let status: PaymentStatusResult["status"] = "paid";
    let failureReason: string | undefined = undefined;

    if (isFailed) {
      status = "failed";
      failureReason = "Payment declined by customer card issuer";
    } else if (isRejected) {
      status = "rejected";
      failureReason = "Transaction rejected by fraud detection filters";
    }

    return {
      gatewayRef,
      status,
      amountMinor: 0,
      currency: "PKR",
      paidAt: status === "paid" ? new Date().toISOString() : undefined,
      failureReason,
      rawResponse: {
        gatewayRef,
        status,
        mockRail: true,
      },
    };
  }

  /**
   * Processes a refund via the mock payment adapter.
   */
  public async refund(params: PaymentRefundParams): Promise<PaymentRefundResult> {
    const refundPkr =
      params.refundAmountPkr ??
      params.amountPkr ??
      (params.refundAmountMinor ? Math.floor(params.refundAmountMinor / 100) : 0);
    const lastDigits = Math.abs(refundPkr % 100);
    const isFailed = lastDigits === 1;

    const refundRef = `mock_ref_${params.idempotencyKey ?? Date.now()}_${Date.now()}`;

    if (isFailed) {
      return {
        success: false,
        refundRef,
        refundGatewayRef: refundRef,
        amountPkr: refundPkr,
        amountMinor: refundPkr * 100,
        status: "failed",
        failureReason: "Simulated refund failure by bank rail",
        rawResponse: {
          error: "REVERSAL_REJECTED",
          idempotencyKey: params.idempotencyKey,
        },
      };
    }

    return {
      success: true,
      refundRef,
      refundGatewayRef: refundRef,
      amountPkr: refundPkr,
      amountMinor: refundPkr * 100,
      status: "succeeded",
      rawResponse: {
        refundRef,
        orderId: params.orderId,
        gatewayRef: params.gatewayRef,
        amountPkr: refundPkr,
        idempotencyKey: params.idempotencyKey,
        status: "succeeded",
      },
    };
  }
}
