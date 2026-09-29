/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { AddToCartInput, UpdateCartItemInput, RemoveCartItemInput } from "@/lib/validators/cart";

export interface CartIdentifier {
  profileId?: string | null;
  guestToken?: string | null;
}

export interface CartItemDetail {
  cartItemId: string;
  variantId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  sku: string;
  attributes: Record<string, string | number>;
  priceMinor: number;
  compareAtMinor: number | null;
  image: string;
  quantity: number;
  stockAvailable: number;
  isAvailable: boolean;
  subtotalMinor: number;
}

export interface SellerCartGroup {
  sellerId: string;
  sellerName: string;
  sellerSlug: string;
  items: CartItemDetail[];
  subtotalMinor: number;
  estimatedShippingMinor: number;
}

export interface CartDetails {
  cartId: string;
  sellerGroups: SellerCartGroup[];
  totalItems: number;
  subtotalMinor: number;
  shippingMinor: number;
  grandTotalMinor: number;
  currency: string;
  hasUnavailableItems: boolean;
}

export interface MergeCartResult {
  mergedCount: number;
  skippedCount: number;
}

export interface CartOperationResult {
  success: boolean;
  message?: string;
  cartDetails?: CartDetails;
}

// Flat estimated shipping rate per seller (PKR 250 in paisa)
export const DEFAULT_SHIPPING_PER_SELLER_MINOR = 25000;

/**
 * Finds or creates a cart record for either an authenticated user or a guest.
 */
export async function getOrCreateCart(
  supabase: SupabaseClient<Database>,
  identifier: CartIdentifier
): Promise<string> {
  const { profileId, guestToken } = identifier;

  if (!profileId && !guestToken) {
    throw new Error("Either profileId or guestToken must be provided to access a cart.");
  }

  // 1. Try finding existing cart
  if (profileId) {
    const { data: userCart, error } = await supabase
      .from("carts")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching user cart: ${error.message}`);
    }

    if (userCart) return userCart.id;

    // Create new cart for user
    const { data: newCart, error: createError } = await supabase
      .from("carts")
      .insert({ profile_id: profileId, currency: "PKR" })
      .select("id")
      .single();

    if (createError) {
      throw new Error(`Failed to create cart for user: ${createError.message}`);
    }
    return newCart.id;
  }

  // 2. Guest cart
  if (guestToken) {
    const { data: guestCart, error } = await supabase
      .from("carts")
      .select("id")
      .eq("guest_token", guestToken)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching guest cart: ${error.message}`);
    }

    if (guestCart) return guestCart.id;

    // Create new cart for guest
    const { data: newCart, error: createError } = await supabase
      .from("carts")
      .insert({ guest_token: guestToken, currency: "PKR" })
      .select("id")
      .single();

    if (createError) {
      throw new Error(`Failed to create cart for guest: ${createError.message}`);
    }
    return newCart.id;
  }

  throw new Error("Unable to initialize cart.");
}

/**
 * Retrieves full cart contents with live server-side prices, stock levels, and grouped by seller.
 */
export async function getCartDetails(
  supabase: SupabaseClient<Database>,
  identifier: CartIdentifier
): Promise<CartDetails> {
  const cartId = await getOrCreateCart(supabase, identifier);

  // Fetch cart items joined with variant, product, seller, and primary product image
interface CartImageRow {
  path: string;
  sort_order: number | null;
}

interface CartSellerRow {
  id: string;
  business_name: string;
  slug: string;
  status: string;
}

interface CartProductRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  seller: CartSellerRow | null;
  images: CartImageRow[] | null;
}

interface CartVariantRow {
  id: string;
  sku: string;
  attributes: unknown;
  price_minor: number | bigint;
  compare_at_minor: number | bigint | null;
  stock_quantity: number;
  reserved_quantity: number;
  is_active: boolean;
  product: CartProductRow | null;
}

interface CartItemRow {
  id: string;
  quantity: number;
  variant: CartVariantRow | null;
}

    const { data: rawItems, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      quantity,
      variant:product_variants (
        id,
        sku,
        attributes,
        price_minor,
        compare_at_minor,
        stock_quantity,
        reserved_quantity,
        is_active,
        product:products (
          id,
          title,
          slug,
          status,
          seller:sellers (
            id,
            business_name,
            slug,
            status
          ),
          images:product_images (
            path,
            sort_order
          )
        )
      )
    `)
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Error loading cart items: ${error.message}`);
  }

  const items = (rawItems as unknown as CartItemRow[]) || [];
  const sellerGroupMap = new Map<string, SellerCartGroup>();
  let totalItemsCount = 0;
  let cartSubtotalMinor = 0;
  let hasUnavailableItems = false;

  for (const item of items) {
    const v = item.variant;
    if (!v) continue;

    const p = v.product;
    if (!p) continue;

    const s = p.seller;
    if (!s) continue;

    const availableStock = Math.max(0, (v.stock_quantity || 0) - (v.reserved_quantity || 0));
    const isVariantActive = v.is_active && p.status === "active" && s.status === "approved";
    const isAvailable = isVariantActive && availableStock >= item.quantity;

    if (!isAvailable) {
      hasUnavailableItems = true;
    }

    // Pick top sorted image or neutral placeholder fallback
    const sortedImages = (p.images || []).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    const imagePath = sortedImages[0]?.path || "/placeholder-product.svg";

    const priceMinor = Number(v.price_minor);
    const compareAtMinor = v.compare_at_minor ? Number(v.compare_at_minor) : null;
    const itemSubtotal = priceMinor * item.quantity;

    // Exclude unavailable items from subtotal and item count
    if (isAvailable) {
      totalItemsCount += item.quantity;
      cartSubtotalMinor += itemSubtotal;
    }

    const parsedAttributes =
      typeof v.attributes === "object" && v.attributes !== null
        ? (v.attributes as Record<string, string | number>)
        : {};

    const itemDetail: CartItemDetail = {
      cartItemId: item.id,
      variantId: v.id,
      productId: p.id,
      productTitle: p.title,
      productSlug: p.slug,
      sku: v.sku,
      attributes: parsedAttributes,
      priceMinor,
      compareAtMinor,
      image: imagePath,
      quantity: item.quantity,
      stockAvailable: availableStock,
      isAvailable,
      subtotalMinor: itemSubtotal,
    };

    if (!sellerGroupMap.has(s.id)) {
      sellerGroupMap.set(s.id, {
        sellerId: s.id,
        sellerName: s.business_name,
        sellerSlug: s.slug,
        items: [],
        subtotalMinor: 0,
        estimatedShippingMinor: 0,
      });
    }

    const group = sellerGroupMap.get(s.id)!;
    group.items.push(itemDetail);
    if (isAvailable) {
      group.subtotalMinor += itemSubtotal;
    }
  }

  // Calculate shipping only for seller groups that have at least one available item
  const sellerGroups = Array.from(sellerGroupMap.values());
  let totalShippingMinor = 0;
  for (const group of sellerGroups) {
    const hasAvailableInGroup = group.items.some((i) => i.isAvailable);
    if (hasAvailableInGroup) {
      group.estimatedShippingMinor = DEFAULT_SHIPPING_PER_SELLER_MINOR;
      totalShippingMinor += DEFAULT_SHIPPING_PER_SELLER_MINOR;
    } else {
      group.estimatedShippingMinor = 0;
    }
  }

  const grandTotalMinor = cartSubtotalMinor + totalShippingMinor;

  return {
    cartId,
    sellerGroups,
    totalItems: totalItemsCount,
    subtotalMinor: cartSubtotalMinor,
    shippingMinor: totalShippingMinor,
    grandTotalMinor,
    currency: "PKR",
    hasUnavailableItems,
  };
}

/**
 * Adds an item to the cart with live database stock checks.
 */
export async function addToCart(
  supabase: SupabaseClient<Database>,
  identifier: CartIdentifier,
  input: AddToCartInput
): Promise<CartOperationResult> {
  const cartId = await getOrCreateCart(supabase, identifier);

  // 1. Verify variant exists and fetch live stock
  const { data: variant, error: varError } = await supabase
    .from("product_variants")
    .select(`
      id,
      is_active,
      stock_quantity,
      reserved_quantity,
      product:products (
        status,
        seller:sellers (status)
      )
    `)
    .eq("id", input.variantId)
    .single();

  if (varError || !variant) {
    throw new Error("Product variant not found or no longer available.");
  }

  interface SingleVariantProduct {
    status: string;
    seller: { status: string } | null;
  }
  const p = variant.product as unknown as SingleVariantProduct | null;
  if (!variant.is_active || p?.status !== "active" || p?.seller?.status !== "approved") {
    throw new Error("This item is currently unavailable.");
  }

  const availableStock = Math.max(0, variant.stock_quantity - variant.reserved_quantity);
  if (availableStock <= 0) {
    throw new Error("This item is currently out of stock.");
  }

  // 2. Check if already in cart
  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("variant_id", input.variantId)
    .maybeSingle();

  const currentCartQty = existingItem?.quantity || 0;
  const newTotalQty = currentCartQty + input.quantity;

  if (newTotalQty > availableStock) {
    throw new Error(
      `Cannot add ${input.quantity} more. Only ${availableStock} in stock (${currentCartQty} already in your cart).`
    );
  }

  if (existingItem) {
    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: newTotalQty })
      .eq("id", existingItem.id);

    if (updateError) {
      throw new Error(`Failed to update item quantity in cart: ${updateError.message}`);
    }
  } else {
    const { error: insertError } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cartId,
        variant_id: input.variantId,
        quantity: input.quantity,
      });

    if (insertError) {
      throw new Error(`Failed to add item to cart: ${insertError.message}`);
    }
  }

  const cartDetails = await getCartDetails(supabase, identifier);
  return { success: true, cartDetails };
}

/**
 * Updates quantity of an existing item in the cart.
 */
export async function updateCartItem(
  supabase: SupabaseClient<Database>,
  identifier: CartIdentifier,
  input: UpdateCartItemInput
): Promise<CartOperationResult> {
  const cartId = await getOrCreateCart(supabase, identifier);

  // If quantity is 0 or less, remove item
  if (input.quantity <= 0) {
    return removeFromCart(supabase, identifier, { variantId: input.variantId });
  }

  // Check live stock, product active status, and seller approved status
  const { data: variant, error: varError } = await supabase
    .from("product_variants")
    .select(`
      id,
      stock_quantity,
      reserved_quantity,
      is_active,
      product:products (
        id,
        status,
        seller:sellers (
          id,
          status
        )
      )
    `)
    .eq("id", input.variantId)
    .single();

  if (varError || !variant || !variant.is_active) {
    throw new Error("Product variant is no longer available.");
  }

  interface VariantJoinedProduct {
    status: string;
    seller: { status: string } | null;
  }
  const p = variant.product as unknown as VariantJoinedProduct | null;
  if (!p || p.status !== "active" || !p.seller || p.seller.status !== "approved") {
    throw new Error("This craft item is currently unavailable.");
  }

  const availableStock = Math.max(0, variant.stock_quantity - variant.reserved_quantity);
  const targetQuantity = Math.min(input.quantity, availableStock);

  if (targetQuantity <= 0) {
    throw new Error("This item is currently out of stock.");
  }

  const { error: updateError } = await supabase
    .from("cart_items")
    .update({ quantity: targetQuantity })
    .eq("cart_id", cartId)
    .eq("variant_id", input.variantId);

  if (updateError) {
    throw new Error(`Failed to update quantity: ${updateError.message}`);
  }

  const cartDetails = await getCartDetails(supabase, identifier);
  const message =
    targetQuantity < input.quantity
      ? `Quantity adjusted to maximum available stock (${targetQuantity}).`
      : undefined;

  return { success: true, message, cartDetails };
}

/**
 * Removes a specific variant from the cart.
 */
export async function removeFromCart(
  supabase: SupabaseClient<Database>,
  identifier: CartIdentifier,
  input: RemoveCartItemInput
): Promise<CartOperationResult> {
  const cartId = await getOrCreateCart(supabase, identifier);

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId)
    .eq("variant_id", input.variantId);

  if (error) {
    throw new Error(`Failed to remove item: ${error.message}`);
  }

  const cartDetails = await getCartDetails(supabase, identifier);
  return { success: true, cartDetails };
}

/**
 * Empties all items from the cart.
 */
export async function clearCart(
  supabase: SupabaseClient<Database>,
  identifier: CartIdentifier
): Promise<void> {
  const cartId = await getOrCreateCart(supabase, identifier);

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId);

  if (error) {
    throw new Error(`Failed to clear cart: ${error.message}`);
  }
}

/**
 * Merges a guest cart into an authenticated user's account upon login.
 * Capped by live available stock for each variant, skipping unavailable variants,
 * and checking every query error.
 */
export async function mergeGuestCart(
  supabase: SupabaseClient<Database>,
  guestToken: string,
  profileId: string
): Promise<MergeCartResult> {
  // 1. Find guest cart
  const { data: guestCart, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("guest_token", guestToken)
    .maybeSingle();

  if (cartError) {
    throw new Error(`Database error fetching guest cart: ${cartError.message}`);
  }

  if (!guestCart) {
    return { mergedCount: 0, skippedCount: 0 };
  }

  // 2. Fetch items from guest cart
  const { data: guestItems, error: itemsError } = await supabase
    .from("cart_items")
    .select("variant_id, quantity")
    .eq("cart_id", guestCart.id);

  if (itemsError) {
    throw new Error(`Database error fetching guest cart items: ${itemsError.message}`);
  }

  if (!guestItems || guestItems.length === 0) {
    // Delete empty guest cart
    const { error: delError } = await supabase.from("carts").delete().eq("id", guestCart.id);
    if (delError) {
      throw new Error(`Database error deleting empty guest cart: ${delError.message}`);
    }
    return { mergedCount: 0, skippedCount: 0 };
  }

  // 3. Ensure user cart exists
  const userCartId = await getOrCreateCart(supabase, { profileId });

  let mergedCount = 0;
  let skippedCount = 0;

  for (const item of guestItems) {
    // Check variant availability, active status, and live stock
    const { data: variant, error: varError } = await supabase
      .from("product_variants")
      .select(`
        id,
        stock_quantity,
        reserved_quantity,
        is_active,
        product:products (
          id,
          status,
          seller:sellers (
            id,
            status
          )
        )
      `)
      .eq("id", item.variant_id)
      .single();

    if (varError || !variant || !variant.is_active) {
      skippedCount++;
      continue;
    }

    interface VariantJoinedProduct {
      status: string;
      seller: { status: string } | null;
    }
    const p = variant.product as unknown as VariantJoinedProduct | null;
    if (!p || p.status !== "active" || !p.seller || p.seller.status !== "approved") {
      skippedCount++;
      continue;
    }

    const availableStock = Math.max(0, variant.stock_quantity - variant.reserved_quantity);
    if (availableStock <= 0) {
      skippedCount++;
      continue;
    }

    // Check if item already exists in user's cart
    const { data: existingUserItem, error: existError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", userCartId)
      .eq("variant_id", item.variant_id)
      .maybeSingle();

    if (existError) {
      throw new Error(`Database error checking user cart item: ${existError.message}`);
    }

    if (existingUserItem) {
      // Cap combined quantity at available stock
      const combinedQuantity = existingUserItem.quantity + item.quantity;
      const targetQuantity = Math.min(availableStock, combinedQuantity);

      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: targetQuantity })
        .eq("id", existingUserItem.id);

      if (updateError) {
        throw new Error(`Database error updating cart item during merge: ${updateError.message}`);
      }
    } else {
      // Cap quantity at available stock
      const targetQuantity = Math.min(availableStock, item.quantity);

      const { error: insertError } = await supabase
        .from("cart_items")
        .insert({
          cart_id: userCartId,
          variant_id: item.variant_id,
          quantity: targetQuantity,
        });

      if (insertError) {
        throw new Error(`Database error inserting cart item during merge: ${insertError.message}`);
      }
    }

    mergedCount++;
  }

  // 4. Clean up guest cart
  const { error: deleteCartError } = await supabase.from("carts").delete().eq("id", guestCart.id);
  if (deleteCartError) {
    throw new Error(`Database error deleting merged guest cart: ${deleteCartError.message}`);
  }

  return { mergedCount, skippedCount };
}
