/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type AddressInsert = Database["public"]["Tables"]["addresses"]["Insert"];
export type AddressUpdate = Database["public"]["Tables"]["addresses"]["Update"];
export type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export async function getAddresses(supabase: SupabaseClient<Database>, profileId: string) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("profile_id", profileId)
    .is("deleted_at", null)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAddress(supabase: SupabaseClient<Database>, profileId: string, payload: Omit<AddressInsert, "profile_id">) {
  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...payload, profile_id: profileId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAddress(
  supabase: SupabaseClient<Database>,
  profileId: string,
  addressId: string,
  payload: Omit<AddressUpdate, "profile_id">
) {
  const { data, error } = await supabase
    .from("addresses")
    .update(payload)
    .eq("id", addressId)
    .eq("profile_id", profileId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAddress(supabase: SupabaseClient<Database>, profileId: string, addressId: string) {
  const { error } = await supabase
    .from("addresses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", addressId)
    .eq("profile_id", profileId);
  if (error) throw error;
}

export async function getWishlist(supabase: SupabaseClient<Database>, profileId: string) {
  const { data, error } = await supabase
    .from("wishlists")
    .select("*, product_variants(*, products(title, slug, product_images(path)))")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addToWishlist(supabase: SupabaseClient<Database>, profileId: string, variantId: string) {
  const { error } = await supabase
    .from("wishlists")
    .insert({ profile_id: profileId, variant_id: variantId });
  if (error) throw error;
}

export async function removeFromWishlist(supabase: SupabaseClient<Database>, profileId: string, variantId: string) {
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("profile_id", profileId)
    .eq("variant_id", variantId);
  if (error) throw error;
}

export async function getAccountDeletionRequest(supabase: SupabaseClient<Database>, profileId: string) {
  const { data, error } = await supabase
    .from("account_deletion_requests")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function requestAccountDeletion(supabase: SupabaseClient<Database>, profileId: string, reason?: string) {
  const { error } = await supabase
    .from("account_deletion_requests")
    .insert({
      profile_id: profileId,
      reason: reason || null,
      status: "pending"
    });
  if (error) throw error;
}

export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];

export async function createReview(
  supabase: SupabaseClient<Database>,
  profileId: string,
  payload: Omit<ReviewInsert, "profile_id">
) {
  const { data, error } = await supabase
    .from("reviews")
    .insert({ ...payload, profile_id: profileId })
    .select()
    .single();
  if (error) throw error;
  return data;
}
