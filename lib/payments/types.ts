/**
 * Payment Gateway Adapter Types
 *
 * NON-NEGOTIABLE RULE:
 * Money is stored and handled strictly as integer minor units (paisa in bigint/integer).
 * Never use float for money.
 * Payment gateways are accessed ONLY through this adapter interface.
 */

export type Currency = "PKR" | "USD" | string;

export interface PaymentCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface InitiatePaymentParams {
  orderId: string;
  /** Amount in integer minor units (e.g. 150000 paisa = 1500.00 PKR) */
  amountInPaisa: bigint;
  currency: Currency;
  customer: PaymentCustomer;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentInitiateResult {
  transactionId: string;
  redirectUrl?: string;
  clientSecret?: string;
  gatewayReference?: string;
  status: "pending" | "action_required" | "failed";
}

export interface VerifyPaymentParams {
  transactionId: string;
  gatewayReference?: string;
  payload?: Record<string, unknown>;
}

export interface PaymentVerificationResult {
  transactionId: string;
  gatewayReference: string;
  amountInPaisa: bigint;
  currency: Currency;
  status: "succeeded" | "failed" | "pending";
  rawResponse?: unknown;
}

export interface RefundParams {
  originalTransactionId: string;
  orderId: string;
  refundAmountInPaisa: bigint;
  currency: Currency;
  reason: string;
  idempotencyKey: string;
}

export interface RefundResult {
  refundId: string;
  status: "succeeded" | "pending" | "failed";
  amountInPaisa: bigint;
  currency: Currency;
  rawResponse?: unknown;
}

export interface WebhookProcessResult {
  eventType: "payment.succeeded" | "payment.failed" | "refund.succeeded" | "unknown";
  orderId?: string;
  transactionId?: string;
  amountInPaisa?: bigint;
  currency?: Currency;
  rawPayload: unknown;
}

export interface PaymentGatewayAdapter {
  readonly id: string;
  readonly displayName: string;

  initiatePayment(params: InitiatePaymentParams): Promise<PaymentInitiateResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult>;
  handleWebhook(payload: unknown, headers: Record<string, string>): Promise<WebhookProcessResult>;
  createRefund(params: RefundParams): Promise<RefundResult>;
}
