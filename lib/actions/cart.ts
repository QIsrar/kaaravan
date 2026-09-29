"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCartIdentifier, GUEST_COOKIE_NAME } from "@/lib/auth/cart-session";
import {
  getCartDetails,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeGuestCart,
  type CartDetails,
  type CartOperationResult,
} from "@/lib/services/cart";
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  postgresUuidSchema,
  type AddToCartInput,
  type UpdateCartItemInput,
  type RemoveCartItemInput,
} from "@/lib/validators/cart";

export async function getCartAction(): Promise<CartDetails | null> {
  const { identifier } = await getCartIdentifier(false);
  if (!identifier.profileId && !identifier.guestToken) {
    return null;
  }
  const adminClient = createAdminClient();
  try {
    return await getCartDetails(adminClient, identifier);
  } catch {
    return null;
  }
}

export async function addToCartAction(input: AddToCartInput): Promise<CartOperationResult> {
  const validated = addToCartSchema.parse(input);
  const { identifier } = await getCartIdentifier(true);
  const adminClient = createAdminClient();

  const result = await addToCart(adminClient, identifier, validated);
  revalidatePath("/cart");
  return result;
}

export async function updateCartItemAction(input: UpdateCartItemInput): Promise<CartOperationResult> {
  const validated = updateCartItemSchema.parse(input);
  const { identifier } = await getCartIdentifier(false);
  if (!identifier.profileId && !identifier.guestToken) {
    throw new Error("No active cart found.");
  }
  const adminClient = createAdminClient();

  const result = await updateCartItem(adminClient, identifier, validated);
  revalidatePath("/cart");
  return result;
}

export async function removeFromCartAction(input: RemoveCartItemInput): Promise<CartOperationResult> {
  const validated = removeCartItemSchema.parse(input);
  const { identifier } = await getCartIdentifier(false);
  if (!identifier.profileId && !identifier.guestToken) {
    throw new Error("No active cart found.");
  }
  const adminClient = createAdminClient();

  const result = await removeFromCart(adminClient, identifier, validated);
  revalidatePath("/cart");
  return result;
}

export async function clearCartAction(): Promise<{ success: boolean }> {
  const { identifier } = await getCartIdentifier(false);
  if (identifier.profileId || identifier.guestToken) {
    const adminClient = createAdminClient();
    await clearCart(adminClient, identifier);
    revalidatePath("/cart");
  }
  return { success: true };
}

export async function mergeGuestCartAction(): Promise<{
  success: boolean;
  mergedCount: number;
  skippedCount: number;
}> {
  const reqCookies = await cookies();
  const guestToken = reqCookies.get(GUEST_COOKIE_NAME)?.value;
  if (!guestToken || !postgresUuidSchema.safeParse(guestToken).success) {
    return { success: false, mergedCount: 0, skippedCount: 0 };
  }

  const { identifier } = await getCartIdentifier(false);
  if (!identifier.profileId) {
    return { success: false, mergedCount: 0, skippedCount: 0 };
  }

  const adminClient = createAdminClient();
  const res = await mergeGuestCart(adminClient, guestToken, identifier.profileId);

  // Delete guest_token cookie server-side
  reqCookies.delete(GUEST_COOKIE_NAME);

  revalidatePath("/cart");
  return {
    success: true,
    mergedCount: res.mergedCount,
    skippedCount: res.skippedCount,
  };
}
