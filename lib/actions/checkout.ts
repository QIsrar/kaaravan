/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCartIdentifier } from "@/lib/auth/cart-session";
import { submitCheckout, type CheckoutSubmissionResult } from "@/lib/services/orders";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/checkout";

export type CheckoutResult = CheckoutSubmissionResult;

/**
 * Server action to validate checkout input and invoke the authoritative checkout service.
 */
export async function submitCheckoutAction(input: CheckoutInput): Promise<CheckoutResult> {
  const validated = checkoutSchema.parse(input);
  const { identifier } = await getCartIdentifier(false);

  if (!identifier.profileId && !identifier.guestToken) {
    throw new Error("No active shopping session found.");
  }

  const headerList = await headers();
  const rawIp = headerList.get("x-forwarded-for") || headerList.get("x-real-ip");
  const ipAddress = rawIp ? rawIp.split(",")[0].trim() : "127.0.0.1";

  const adminClient = createAdminClient();
  return submitCheckout(adminClient, identifier, validated, { ipAddress });
}
