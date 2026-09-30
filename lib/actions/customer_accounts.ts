"use server";

/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createAddress,
  updateAddress,
  deleteAddress,
  addToWishlist,
  removeFromWishlist,
  requestAccountDeletion,
  createReview,
  updateProfile,
} from "@/lib/services/customer_accounts";
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  createReviewSchema,
  type UpdateProfileInput,
  type CreateAddressInput,
  type UpdateAddressInput,
  type CreateReviewInput,
} from "@/lib/validators/customer_accounts";
import { requireAuth } from "@/lib/auth/roles";

export async function createAddressAction(payload: CreateAddressInput) {
  const profile = await requireAuth();
  const validated = createAddressSchema.parse(payload);
  const supabase = await createClient();
  const address = await createAddress(supabase, profile.id, validated);
  revalidatePath("/account/addresses");
  revalidatePath("/(store)/account/addresses");
  return address;
}

export async function updateAddressAction(
  addressId: string,
  payload: UpdateAddressInput
) {
  const profile = await requireAuth();
  const validated = updateAddressSchema.parse(payload);
  const supabase = await createClient();
  const address = await updateAddress(supabase, profile.id, addressId, validated);
  revalidatePath("/account/addresses");
  revalidatePath("/(store)/account/addresses");
  return address;
}

export async function deleteAddressAction(addressId: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  await deleteAddress(supabase, profile.id, addressId);
  revalidatePath("/account/addresses");
  revalidatePath("/(store)/account/addresses");
}

export async function addToWishlistAction(variantId: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  await addToWishlist(supabase, profile.id, variantId);
  revalidatePath("/account/wishlist");
  revalidatePath("/(store)/account/wishlist");
}

export async function removeFromWishlistAction(variantId: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  await removeFromWishlist(supabase, profile.id, variantId);
  revalidatePath("/account/wishlist");
  revalidatePath("/(store)/account/wishlist");
}

export async function getWishlistVariantIdsAction(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("wishlists")
    .select("variant_id")
    .eq("profile_id", user.id);
  if (error || !data) return [];
  return data.map((d) => d.variant_id);
}

export async function updateProfileAction(payload: UpdateProfileInput) {
  const profile = await requireAuth();
  const validated = updateProfileSchema.parse(payload);
  const supabase = await createClient();
  const updated = await updateProfile(supabase, profile.id, validated);
  revalidatePath("/account");
  revalidatePath("/account/settings");
  revalidatePath("/(store)/account");
  revalidatePath("/(store)/account/settings");
  return updated;
}

export async function requestAccountDeletionAction(reason?: string) {
  const profile = await requireAuth();
  const supabase = await createClient();
  await requestAccountDeletion(supabase, profile.id, reason);
  revalidatePath("/account/settings");
  revalidatePath("/(store)/account/settings");
}

export async function createReviewAction(payload: CreateReviewInput) {
  const profile = await requireAuth();
  const validated = createReviewSchema.parse(payload);
  const supabase = await createClient();
  const review = await createReview(supabase, profile.id, validated);
  revalidatePath("/product/[slug]");
  revalidatePath("/(store)/product/[slug]");
  revalidatePath("/account/reviews");
  revalidatePath("/(store)/account/reviews");
  return review;
}
