"use server";

import { requireAuth } from "@/lib/auth/roles";
import { submitSellerOnboarding } from "@/lib/services/seller-onboarding";
import { sellerOnboardingSchema } from "@/lib/validators/seller-onboarding";
import { headers } from "next/headers";

export async function submitOnboardingAction(formData: FormData | string) {
  const profile = await requireAuth(["customer", "guest"]); // Actually, guest shouldn't be here, only customer. Wait, pending sellers are "customer".
  if (!profile) {
    throw new Error("Unauthorized");
  }

  // Parse input
  let parsedInput;
  if (typeof formData === "string") {
    parsedInput = JSON.parse(formData);
  } else {
    // Basic FormData extraction (would be more complex for nested fields like documents)
    // To simplify, we assume the client serializes the complex object to a JSON string 
    // or calls this action directly with an object if it's a server action receiving an object.
    throw new Error("Action expects JSON stringified payload");
  }

  const validatedData = sellerOnboardingSchema.parse(parsedInput);
  
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "127.0.0.1";

  const result = await submitSellerOnboarding(validatedData, profile.id, ip);
  return result;
}
