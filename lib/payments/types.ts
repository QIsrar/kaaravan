/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

/**
 * Payment Gateway Adapter Types (Phase 8 Remediation)
 *
 * NON-NEGOTIABLE RULES:
 * 1. Money is stored and handled strictly as whole Pakistani Rupees (PKR) as integer values.
 * 2. Payment gateways are accessed ONLY through this adapter interface. No gateway-specific code outside its adapter.
 * 3. Provider-specific wire formats (e.g. cents/paisa on external wire) are converted ONLY inside adapter boundary.
 */

import type { Json } from "@/lib/types/database";

export type PaymentMethod = "cod" | "jazzcash" | "easypaisa" | "card" | "bank_transfer" | "mock";

export interface PaymentCustomerInfo {
  id?: string;
  name: string;
  email?: string;
  phone: string;
}

export interface CreatePaymentSessionParams {
  orderId: string;
  orderNumber: string;
  /** Amount in integer whole PKR */
  amountPkr: number;
  amountMinor?: number;
  currency: string;
  method: PaymentMethod;
  customer: PaymentCustomerInfo;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  scenarioOverride?: "success" | "failure" | "rejected";
}

export interface PaymentSessionResult {
  sessionUrl?: string;
  gatewayRef: string;
  status: "pending" | "succeeded" | "failed" | "rejected";
  clientSecret?: string;
  rawResponse?: Json;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  gatewayRef: string;
  orderId?: string;
  orderNumber?: string;
  amountPkr: number;
  amountMinor?: number;
  currency: string;
  status: "paid" | "failed" | "rejected" | "refunded";
  failureReason?: string;
  rawPayload: Json;
}

export interface PaymentStatusResult {
  gatewayRef: string;
  orderId?: string;
  amountPkr?: number;
  amountMinor?: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "rejected" | "refunded";
  paidAt?: string;
  method?: PaymentMethod;
  failureReason?: string;
  rawResponse?: Json;
}

export interface PaymentRefundParams {
  orderId?: string;
  paymentId?: string;
  gatewayRef: string;
  amountPkr?: number;
  amountMinor?: number;
  refundAmountPkr?: number;
  refundAmountMinor?: number;
  currency: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface PaymentRefundResult {
  success: boolean;
  refundRef?: string;
  refundGatewayRef?: string;
  amountPkr?: number;
  amountMinor?: number;
  currency?: string;
  status: "succeeded" | "failed" | "pending";
  failureReason?: string;
  rawResponse?: Json;
}

export interface PaymentGatewayAdapter {
  readonly id: string;
  readonly displayName: string;

  /**
   * Initializes a payment transaction session with the upstream rail.
   */
  createPaymentSession(params: CreatePaymentSessionParams): Promise<PaymentSessionResult>;

  /**
   * Verifies an incoming webhook cryptographic signature and parses the event payload.
   */
  verifyWebhook(
    payload: string | Record<string, unknown>,
    headers: Record<string, string>
  ): Promise<WebhookVerificationResult>;

  /**
   * Queries upstream provider for current transaction status (polling / reconciliation).
   */
  getStatus?(gatewayRef: string, transactionId?: string): Promise<PaymentStatusResult>;
  getPaymentStatus?(gatewayRef: string): Promise<PaymentStatusResult>;

  /**
   * Dispatches a partial or full refund request to the payment gateway.
   */
  refund?(params: PaymentRefundParams): Promise<PaymentRefundResult>;
  refundPayment?(params: PaymentRefundParams): Promise<PaymentRefundResult>;
}
