export * from "./types";

/**
 * Adapter Registry for Payment Gateways.
 * Concrete implementations (JazzCash, EasyPaisa, PayFast, Stripe, etc.)
 * will register through this interface in their respective implementation phase.
 *
 * NON-NEGOTIABLE RULE 9:
 * No gateway-specific code outside its adapter.
 */
export interface PaymentRegistry {
  getAdapter(gatewayId: string): import("./types").PaymentGatewayAdapter | undefined;
  registerAdapter(adapter: import("./types").PaymentGatewayAdapter): void;
}
