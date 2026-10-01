/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { SellerOnboardingInput } from "@/lib/validators/seller-onboarding";

function generateSlug(name: string): string {
  const generated = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
    
  if (!generated) {
    return "shop-" + Math.random().toString(36).substring(2, 8);
  }
  return generated;
}

export async function submitSellerOnboarding(
  input: SellerOnboardingInput,
  profileId: string,
  ipAddress: string
) {
  const supabase = createAdminClient();

  // 1. Check if user already has a pending or approved seller profile
  const { data: existingSeller } = await supabase
    .from("sellers")
    .select("id, status")
    .eq("owner_profile_id", profileId)
    .single();

  if (existingSeller) {
    if (existingSeller.status === "pending") {
      throw new Error("You already have a pending application.");
    }
    if (existingSeller.status === "approved") {
      throw new Error("You are already an approved seller.");
    }
  }

  // 2. Generate a unique slug
  const baseSlug = generateSlug(input.businessName);
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const { count } = await supabase
      .from("sellers")
      .select("id", { count: "exact", head: true })
      .eq("slug", slug);
    if (count === 0) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // 3. Call the single RPC to submit the application
  const { data: sellerId, error } = await supabase.rpc("submit_seller_application", {
    p_profile_id: profileId,
    p_business_name: input.businessName,
    p_slug: slug,
    p_description: input.description || "",
    p_business_type: input.businessType,
    p_cnic: input.cnicNumber,
    p_ntn: input.ntn || "",
    p_bank_name: input.bankName,
    p_account_title: input.accountTitle,
    p_iban: input.iban,
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_province: input.province,
    p_city: input.city,
    p_area: input.area,
    p_street: input.street,
    p_postal_code: input.postalCode || "",
    p_ip_address: ipAddress
  });

  if (error) {
    throw new Error(`Onboarding failed: ${error.message}`);
  }

  return { sellerId };
}
