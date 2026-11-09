/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

export * from "./types";
export * from "./mock";

import type { PaymentGatewayAdapter } from "./types";
import { MockGateway } from "./mock";

/**
 * Adapter Registry for Payment Gateways.
 * Concrete implementations (JazzCash, EasyPaisa, PayFast, Stripe, etc.)
 * register through this interface in their respective implementation phase.
 *
 * NON-NEGOTIABLE RULE 9:
 * Payment gateways and couriers are accessed ONLY through adapter interfaces.
 * No gateway-specific code outside its adapter.
 */
class PaymentAdapterRegistry {
  private adapters = new Map<string, PaymentGatewayAdapter>();

  constructor() {
    // Default mock gateway supporting mock, jazzcash, easypaisa, and card rails
    const mock = new MockGateway();
    this.registerAdapter(mock);
    this.adapters.set("jazzcash", mock);
    this.adapters.set("easypaisa", mock);
    this.adapters.set("card", mock);
  }

  public registerAdapter(adapter: PaymentGatewayAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  public getAdapter(gatewayId = "mock"): PaymentGatewayAdapter {
    const adapter = this.adapters.get(gatewayId.toLowerCase());
    if (!adapter) {
      // Fallback to mock adapter
      const fallback = this.adapters.get("mock");
      if (fallback) return fallback;
      throw new Error(`Payment gateway adapter not registered: ${gatewayId}`);
    }
    return adapter;
  }
}

const globalRegistry = new PaymentAdapterRegistry();

/**
 * Retrieves the appropriate payment gateway adapter for a given gateway or method identifier.
 */
export function getPaymentAdapter(gatewayId = "mock"): PaymentGatewayAdapter {
  return globalRegistry.getAdapter(gatewayId);
}
