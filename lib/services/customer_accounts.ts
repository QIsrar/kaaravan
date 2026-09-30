/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export interface CreateAddressPayload {
  label?: string | null;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  area: string;
  street: string;
  postal_code?: string | null;
  is_default?: boolean;
}

export interface UpdateAddressPayload {
  label?: string | null;
  full_name?: string;
  phone?: string;
  province?: string;
  city?: string;
  area?: string;
  street?: string;
  postal_code?: string | null;
  is_default?: boolean;
}

export interface CreateReviewPayload {
  product_id: string;
  order_item_id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
}

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

export async function createAddress(
  supabase: SupabaseClient<Database>,
  profileId: string,
  payload: CreateAddressPayload
) {
  if (payload.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("profile_id", profileId)
      .eq("is_default", true);
  }

  // Explicitly build the record; never pass client objects directly
  const insertData = {
    profile_id: profileId,
    label: payload.label ?? null,
    full_name: payload.full_name.trim(),
    phone: payload.phone.trim(),
    province: payload.province.trim(),
    city: payload.city.trim(),
    area: payload.area.trim(),
    street: payload.street.trim(),
    postal_code: payload.postal_code ? payload.postal_code.trim() : null,
    is_default: Boolean(payload.is_default),
  };

  const { data, error } = await supabase
    .from("addresses")
    .insert(insertData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAddress(
  supabase: SupabaseClient<Database>,
  profileId: string,
  addressId: string,
  payload: UpdateAddressPayload
) {
  if (payload.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("profile_id", profileId)
      .eq("is_default", true);
  }

  // Explicitly build allowed update fields only; never pass unvalidated fields
  const updateData: Database["public"]["Tables"]["addresses"]["Update"] = {};
  if (payload.label !== undefined) updateData.label = payload.label ? payload.label.trim() : null;
  if (payload.full_name !== undefined) updateData.full_name = payload.full_name.trim();
  if (payload.phone !== undefined) updateData.phone = payload.phone.trim();
  if (payload.province !== undefined) updateData.province = payload.province.trim();
  if (payload.city !== undefined) updateData.city = payload.city.trim();
  if (payload.area !== undefined) updateData.area = payload.area.trim();
  if (payload.street !== undefined) updateData.street = payload.street.trim();
  if (payload.postal_code !== undefined) {
    updateData.postal_code = payload.postal_code ? payload.postal_code.trim() : null;
  }
  if (payload.is_default !== undefined) updateData.is_default = Boolean(payload.is_default);

  const { data, error } = await supabase
    .from("addresses")
    .update(updateData)
    .eq("id", addressId)
    .eq("profile_id", profileId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(
  supabase: SupabaseClient<Database>,
  profileId: string,
  payload: { full_name?: string; phone?: string | null }
) {
  // Service explicitly builds { full_name, phone } itself
  const updateData: { full_name?: string; phone?: string | null } = {};
  if (typeof payload.full_name === "string") {
    updateData.full_name = payload.full_name.trim();
  }
  if (payload.phone !== undefined) {
    updateData.phone = payload.phone ? payload.phone.trim() : null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", profileId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAddress(
  supabase: SupabaseClient<Database>,
  profileId: string,
  addressId: string
) {
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

export async function addToWishlist(
  supabase: SupabaseClient<Database>,
  profileId: string,
  variantId: string
) {
  // Check if caller is a seller who owns this product
  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("owner_profile_id", profileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (seller) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("product_id, products!inner(seller_id)")
      .eq("id", variantId)
      .single();

    const productSellerId = (variant?.products as unknown as { seller_id: string })?.seller_id;
    if (productSellerId && productSellerId === seller.id) {
      throw new Error("You can't buy your own products");
    }
  }

  const { error } = await supabase
    .from("wishlists")
    .insert({ profile_id: profileId, variant_id: variantId });
  if (error) throw error;
}

export async function removeFromWishlist(
  supabase: SupabaseClient<Database>,
  profileId: string,
  variantId: string
) {
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("profile_id", profileId)
    .eq("variant_id", variantId);
  if (error) throw error;
}

export async function getAccountDeletionRequest(
  supabase: SupabaseClient<Database>,
  profileId: string
) {
  const { data, error } = await supabase
    .from("account_deletion_requests")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function requestAccountDeletion(
  supabase: SupabaseClient<Database>,
  profileId: string,
  reason?: string
) {
  const { error } = await supabase
    .from("account_deletion_requests")
    .insert({
      profile_id: profileId,
      reason: reason ? reason.trim() : null,
      status: "pending",
    });
  if (error) throw error;
}

export async function createReview(
  supabase: SupabaseClient<Database>,
  profileId: string,
  payload: CreateReviewPayload
) {
  // Check if caller is a seller who owns this product
  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("owner_profile_id", profileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (seller) {
    const { data: product } = await supabase
      .from("products")
      .select("seller_id")
      .eq("id", payload.product_id)
      .single();

    if (product && product.seller_id === seller.id) {
      throw new Error("You can't review your own products");
    }
  }

  // Explicitly build the review insert record with server-enforced status: 'pending'
  const insertData = {
    profile_id: profileId,
    product_id: payload.product_id,
    order_item_id: payload.order_item_id,
    rating: payload.rating,
    title: payload.title ? payload.title.trim() : null,
    body: payload.body ? payload.body.trim() : null,
    status: "pending" as const,
  };

  const { data, error } = await supabase
    .from("reviews")
    .insert(insertData)
    .select()
    .single();
  if (error) throw error;
  return data;
}
