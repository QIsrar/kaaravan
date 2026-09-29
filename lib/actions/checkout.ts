"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCartIdentifier } from "@/lib/auth/cart-session";
import { submitCheckout, type CheckoutSubmissionResult } from "@/lib/services/orders";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/checkout";

export type CheckoutResult = CheckoutSubmissionResult;

/**
 * Server action to validate checkout input and invoke the checkout service.
 */
export async function submitCheckoutAction(input: CheckoutInput): Promise<CheckoutResult> {
  const validated = checkoutSchema.parse(input);
  const { identifier } = await getCartIdentifier(false);

  if (!identifier.profileId && !identifier.guestToken) {
    throw new Error("No active shopping session found.");
  }

  const adminClient = createAdminClient();
  return submitCheckout(adminClient, identifier, validated);
}
