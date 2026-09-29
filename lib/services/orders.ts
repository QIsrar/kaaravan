/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { CartIdentifier } from "@/lib/services/cart";
import { getCartDetails } from "@/lib/services/cart";
import type { CheckoutInput } from "@/lib/validators/checkout";

/**
 * Creates an authoritative order from client checkout input.
 * In Phase 4, the storefront UI and validation are fully functional for guests and users,
 * but order creation, payment gateway routing, and ledger entries are locked until Phase 8.
 */
export async function createOrder(
  _supabase: SupabaseClient<Database>,
  _input: CheckoutInput,
  _context?: { profileId?: string | null; guestToken?: string | null }
): Promise<never> {
  void _supabase;
  void _input;
  void _context;
  // Explicit Phase 4 mandate: placeholder createOrder() throws "Phase 8"
  throw new Error("Phase 8: Order creation and payment gateway settlement will be activated in Phase 8.");
}

export interface CheckoutSubmissionResult {
  success: boolean;
  phase8Notice?: boolean;
  message: string;
}

/**
 * Validates the cart is non-empty and attempts order creation, translating the
 * expected Phase 4 "Phase 8" placeholder error into a friendly, non-throwing result.
 * Shared by the checkout server action and the /api/v1/checkout route handler.
 */
export async function submitCheckout(
  supabase: SupabaseClient<Database>,
  identifier: CartIdentifier,
  input: CheckoutInput
): Promise<CheckoutSubmissionResult> {
  const cart = await getCartDetails(supabase, identifier);
  if (cart.totalItems === 0) {
    throw new Error("Your cart is empty.");
  }

  try {
    await createOrder(supabase, input, identifier);
    return { success: true, message: "Order placed successfully!" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Phase 8")) {
      return { success: true, phase8Notice: true, message: msg };
    }
    throw err;
  }
}
