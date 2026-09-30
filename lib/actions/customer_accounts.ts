"use server";

/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAddress, updateAddress, deleteAddress, addToWishlist, removeFromWishlist, requestAccountDeletion, createReview } from "@/lib/services/customer_accounts";
import type { AddressInsert, AddressUpdate, ReviewInsert } from "@/lib/services/customer_accounts";
import { requireAuth } from "@/lib/auth/roles";

export async function createAddressAction(payload: Omit<AddressInsert, "profile_id">) {
  const profile = await requireAuth();
  const supabase = await createClient();
  const address = await createAddress(supabase, profile.id, payload);
  revalidatePath("/(store)/account/addresses");
  return address;
}

export async function updateAddressAction(addressId: string, payload: Omit<AddressUpdate, "profile_id">) {
  const profile = await requireAuth();
  const supabase = await createClient();
  const address = await updateAddress(supabase, profile.id, addressId, payload);
  revalidatePath("/(store)/account/addresses");
  return address;
}

export async function deleteAddressAction(addressId: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  await deleteAddress(supabase, profile.id, addressId);
  revalidatePath("/(store)/account/addresses");
}

export async function addToWishlistAction(variantId: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  await addToWishlist(supabase, profile.id, variantId);
  revalidatePath("/(store)/account/wishlist");
}

export async function removeFromWishlistAction(variantId: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  await removeFromWishlist(supabase, profile.id, variantId);
  revalidatePath("/(store)/account/wishlist");
}

export async function requestAccountDeletionAction(reason?: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  await requestAccountDeletion(supabase, profile.id, reason);
  revalidatePath("/(store)/account/settings");
}

export async function createReviewAction(payload: Omit<ReviewInsert, "profile_id">) {
  const profile = await requireAuth();
  const supabase = await createClient();
  const review = await createReview(supabase, profile.id, payload);
  // Revalidate product page where review is shown
  revalidatePath("/(store)/products/[slug]");
  revalidatePath("/(store)/account/reviews");
  return review;
}
