/* eslint-disable @typescript-eslint/no-explicit-any */
/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";

export async function getSellerSettings(profileId: string) {
  const supabase = createAdminClient();
  
  const { data: seller, error } = await supabase
    .from("sellers")
    .select(`
      id,
      business_name,
      description,
      logo,
      status,
      seller_pickup_addresses(
        full_name, phone, province, city, area, street, postal_code
      ),
      seller_bank_accounts(
        bank_name, iban
      )
    `)
    .eq("owner_profile_id", profileId)
    .eq("seller_pickup_addresses.is_default", true)
    .single();

  if (error || !seller) {
    throw new Error("Seller not found");
  }

  return seller;
}

export async function updateSellerSettings(
  profileId: string,
  ipAddress: string,
  updates: {
    description?: string;
    logo?: string;
    banner?: string;
    pickupAddress?: {
      full_name: string;
      phone: string;
      province: string;
      city: string;
      area: string;
      street: string;
      postal_code?: string;
    };
  }
) {
  const supabase = createAdminClient();

  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("id, description, logo")
    .eq("owner_profile_id", profileId)
    .single();

  if (sellerError || !seller) {
    throw new Error("Seller not found");
  }

  // Update sellers table
  const sellerUpdates: any = {};
  if (updates.description !== undefined) sellerUpdates.description = updates.description;
  if (updates.logo !== undefined) sellerUpdates.logo = updates.logo;

  if (Object.keys(sellerUpdates).length > 0) {
    const { error } = await supabase
      .from("sellers")
      .update(sellerUpdates)
      .eq("id", seller.id);
    if (error) throw new Error("Failed to update seller profile");

    await supabase.from("audit_logs").insert({
      actor_id: profileId,
      action: "SELLER_PROFILE_UPDATED",
      entity: "sellers",
      entity_id: seller.id,
      before: { description: seller.description, logo: seller.logo },
      after: sellerUpdates,
      ip: ipAddress
    });
  }

  // Update default pickup address
  if (updates.pickupAddress) {
    const { data: oldAddress, error: addressFetchError } = await supabase
      .from("seller_pickup_addresses")
      .select("*")
      .eq("seller_id", seller.id)
      .eq("is_default", true)
      .single();

    if (!addressFetchError && oldAddress) {
      const { error } = await supabase
        .from("seller_pickup_addresses")
        .update(updates.pickupAddress)
        .eq("id", oldAddress.id);
      
      if (error) throw new Error("Failed to update pickup address");

      await supabase.from("audit_logs").insert({
        actor_id: profileId,
        action: "SELLER_ADDRESS_UPDATED",
        entity: "seller_pickup_addresses",
        entity_id: oldAddress.id,
        before: oldAddress,
        after: updates.pickupAddress,
        ip: ipAddress
      });
    }
  }

  return { success: true };
}
