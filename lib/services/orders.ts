/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { CartIdentifier } from "@/lib/services/cart";
import { getCartDetails } from "@/lib/services/cart";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CheckoutInput } from "@/lib/validators/checkout";
import { notifyOrderCancellation } from "@/lib/services/notifications";
import { createCodConfirmationToken } from "@/lib/services/cod-confirmation";

export interface SubOrderCreationSnapshot {
  subOrderId: string;
  sellerId: string;
  subtotalPkr: number;
  shippingPkr: number;
  totalPkr: number;
  commissionPkr: number;
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  commissionMinor: number;
  status: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  paymentMethod: Database["public"]["Enums"]["payment_method"];
  paymentStatus: Database["public"]["Enums"]["payment_status"];
  subtotalPkr: number;
  shippingPkr: number;
  discountPkr: number;
  totalPkr: number;
  subtotalMinor: number;
  shippingMinor: number;
  discountMinor: number;
  totalMinor: number;
  subOrders: SubOrderCreationSnapshot[];
  isIdempotent?: boolean;
  codConfirmation?: {
    channel: string;
    status: string;
    confirmationUrl: string;
  };
  reservationExpiresAt?: string;
}

export interface CheckoutSubmissionResult {
  success: boolean;
  message: string;
  order?: CreateOrderResult;
}

/**
 * Computes a standardized SHA-256 hash of a Pakistani phone number for buyer_trust lookup.
 */
export function hashBuyerPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return createHash("sha256").update(digits).digest("hex");
}

/**
 * Dispatcher for COD WhatsApp / SMS verification link using cryptographically secure token (HIGH-04).
 */
export async function sendCodConfirmationNotification(params: {
  orderId: string;
  orderNumber: string;
  phone: string;
}): Promise<{ channel: string; status: string; confirmationUrl: string }> {
  const tokenResult = await createCodConfirmationToken(params);

  // Log delivery dispatch for auditability
  console.info(
    `[COD Notification] Dispatched verification link to ${params.phone} for Order ${params.orderNumber}: ${tokenResult.confirmationUrl}`
  );

  return {
    channel: "sms_whatsapp",
    status: "pending",
    confirmationUrl: tokenResult.confirmationUrl,
  };
}

/**
 * Creates an authoritative order backed by a single Postgres transaction RPC (`create_order_transaction`).
 * Re-reads prices, validates stock under row locks, ensures seller status is approved, calculates multi-seller
 * commissions, writes financial snapshots, generates non-sequential order numbers, and clears the cart.
 */
export async function createOrder(
  supabase: SupabaseClient<Database>,
  input: CheckoutInput,
  context?: {
    profileId?: string | null;
    guestToken?: string | null;
    ipAddress?: string | null;
  }
): Promise<CreateOrderResult> {
  const adminClient = createAdminClient();
  const profileId = context?.profileId ?? null;
  const guestToken = context?.guestToken ?? null;
  const ipAddress = context?.ipAddress ?? "system";

  // 1. Check guest checkout configuration from settings table
  if (!profileId) {
    const { data: guestSetting, error: settingError } = await adminClient
      .from("settings")
      .select("value")
      .eq("key", "allow_guest_checkout")
      .maybeSingle();

    if (!settingError && guestSetting?.value !== null && guestSetting?.value !== undefined) {
      const val = guestSetting.value;
      const isAllowed = typeof val === "boolean" ? val : typeof val === "object" && val !== null && "enabled" in val ? Boolean((val as { enabled: unknown }).enabled) : true;
      if (!isAllowed) {
        throw new Error("Guest checkout is currently disabled. Please sign in or create an account to complete your purchase.");
      }
    }
  }

  // 2. Prevent a seller from purchasing from their own shop
  if (profileId) {
    const { data: sellerRecord } = await adminClient
      .from("sellers")
      .select("id")
      .eq("owner_profile_id", profileId)
      .maybeSingle();

    if (sellerRecord) {
      const userSellerId = sellerRecord.id;
      // Fetch cart to verify seller owns none of the items
      const cart = await getCartDetails(supabase, { profileId, guestToken });
      const ownsProduct = cart.sellerGroups.some((group) => group.sellerId === userSellerId);
      if (ownsProduct) {
        throw new Error("You cannot purchase items from your own store.");
      }
    }
  }

  // 3. For Cash on Delivery, inspect buyer_trust risk level
  if (input.paymentMethod === "cod") {
    const phoneHash = hashBuyerPhone(input.shippingAddress.phone);
    const { data: trustRecord, error: trustError } = await adminClient
      .from("buyer_trust")
      .select("risk_level, total_cod_orders, refused")
      .eq("phone_hash", phoneHash)
      .maybeSingle();

    if (!trustError && trustRecord && trustRecord.risk_level === "high") {
      throw new Error(
        "High-risk COD policy: For this delivery destination and account history, a shipping deposit or advance payment is required via online payment (JazzCash, EasyPaisa, or Card) before dispatch can be scheduled. Please select an online payment method."
      );
    }
  }

  // 4. Fetch cart details to assemble line items and seller shipping
  const cart = await getCartDetails(supabase, { profileId, guestToken });
  if (cart.totalItems === 0) {
    throw new Error("Your cart is empty.");
  }
  if (cart.hasUnavailableItems) {
    throw new Error("Your cart contains items that are no longer available. Please update your cart before proceeding.");
  }

  const items = cart.sellerGroups.flatMap((group) =>
    group.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      expectedPricePkr: item.pricePkr,
    }))
  );

  const sellerShipping: Record<string, number> = {};
  for (const group of cart.sellerGroups) {
    sellerShipping[group.sellerId] = group.estimatedShippingPkr;
  }

  const idempotencyKey = input.idempotencyKey?.trim() || undefined;
  const billingAddress = input.billingAddressSameAsShipping
    ? input.shippingAddress
    : (input.billingAddress ?? input.shippingAddress);

  // 5. Execute atomic database transaction RPC
  const { data: rawRpcResult, error: rpcError } = await adminClient.rpc("create_order_transaction", {
    p_profile_id: profileId ?? undefined,
    p_guest_email: profileId ? undefined : (input.guestEmail || undefined),
    p_guest_phone: profileId ? undefined : input.shippingAddress.phone,
    p_shipping_address: input.shippingAddress,
    p_billing_address: billingAddress,
    p_payment_method: input.paymentMethod,
    p_idempotency_key: idempotencyKey,
    p_ip_address: ipAddress,
    p_order_notes: input.orderNotes || undefined,
    p_discount_pkr: 0,
    p_items: items,
    p_seller_shipping: sellerShipping,
  });

  if (rpcError) {
    throw new Error(`Order placement failed: ${rpcError.message}`);
  }

  if (!rawRpcResult || typeof rawRpcResult !== "object" || Array.isArray(rawRpcResult)) {
    throw new Error("Unexpected empty response from order transaction.");
  }

  const resultObj = rawRpcResult as Record<string, unknown>;

  if (resultObj.success !== true) {
    const errorCode = typeof resultObj.error_code === "string" ? resultObj.error_code : "ORDER_CREATION_FAILED";
    const errorMessage = typeof resultObj.message === "string" ? resultObj.message : "Failed to place order";

    if (errorCode === "PRICE_DIFF" && resultObj.diff && typeof resultObj.diff === "object") {
      const diff = resultObj.diff as { expected_price_pkr: number; actual_price_pkr: number };
      throw new Error(
        `${errorMessage} (Expected: PKR ${diff.expected_price_pkr.toLocaleString("en-PK")}, Current: PKR ${diff.actual_price_pkr.toLocaleString("en-PK")})`
      );
    }

    if (errorCode === "INSUFFICIENT_STOCK" && resultObj.diff && typeof resultObj.diff === "object") {
      const diff = resultObj.diff as { available_stock: number; requested_quantity: number };
      throw new Error(
        `${errorMessage} (Available: ${diff.available_stock}, Requested: ${diff.requested_quantity})`
      );
    }

    throw new Error(errorMessage);
  }

  const subtotalPkr = Number(resultObj.subtotal_pkr ?? 0);
  const shippingPkr = Number(resultObj.shipping_pkr ?? 0);
  const discountPkr = Number(resultObj.discount_pkr ?? 0);
  const totalPkr = Number(resultObj.total_pkr ?? 0);

  // 6. Handle idempotent replay if already created
  if (resultObj.is_idempotent === true) {
    return {
      success: true,
      orderId: String(resultObj.order_id),
      orderNumber: String(resultObj.order_number),
      paymentMethod: input.paymentMethod,
      paymentStatus: (resultObj.payment_status as Database["public"]["Enums"]["payment_status"]) || "pending",
      subtotalPkr,
      shippingPkr,
      discountPkr,
      totalPkr,
      subtotalMinor: subtotalPkr,
      shippingMinor: shippingPkr,
      discountMinor: discountPkr,
      totalMinor: totalPkr,
      subOrders: [],
      isIdempotent: true,
    };
  }

  // 7. Clear cart items upon successful order creation
  if (cart.cartId) {
    const { error: clearError } = await adminClient
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.cartId);

    if (clearError) {
      console.error("Non-fatal: failed to clear cart items after order creation:", clearError.message);
    }
  }

  // 8. Parse sub_orders from RPC response
  const rawSubOrders = Array.isArray(resultObj.sub_orders) ? resultObj.sub_orders : [];
  const subOrders: SubOrderCreationSnapshot[] = rawSubOrders.map((s) => {
    const item = s as Record<string, unknown>;
    const sSubtotal = Number(item.subtotal_pkr ?? 0);
    const sShipping = Number(item.shipping_pkr ?? 0);
    const sTotal = Number(item.total_pkr ?? 0);
    const sCommission = Number(item.commission_pkr ?? 0);
    return {
      subOrderId: String(item.sub_order_id ?? ""),
      sellerId: String(item.seller_id ?? ""),
      subtotalPkr: sSubtotal,
      shippingPkr: sShipping,
      totalPkr: sTotal,
      commissionPkr: sCommission,
      subtotalMinor: sSubtotal,
      shippingMinor: sShipping,
      totalMinor: sTotal,
      commissionMinor: sCommission,
      status: String(item.status ?? "pending"),
    };
  });

  const orderId = String(resultObj.order_id);
  const orderNumber = String(resultObj.order_number);

  // 9. Process COD verification or online payment reservation window
  let codConfirmation: CreateOrderResult["codConfirmation"] = undefined;
  let reservationExpiresAt: string | undefined = undefined;

  if (input.paymentMethod === "cod") {
    codConfirmation = await sendCodConfirmationNotification({
      orderId,
      orderNumber,
      phone: input.shippingAddress.phone,
    });
  } else {
    // 15-minute stock reservation window for online payment
    reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  }

  return {
    success: true,
    orderId,
    orderNumber,
    paymentMethod: input.paymentMethod,
    paymentStatus: (resultObj.payment_status as Database["public"]["Enums"]["payment_status"]) || "pending",
    subtotalPkr,
    shippingPkr,
    discountPkr,
    totalPkr,
    subtotalMinor: subtotalPkr,
    shippingMinor: shippingPkr,
    discountMinor: discountPkr,
    totalMinor: totalPkr,
    subOrders,
    codConfirmation,
    reservationExpiresAt,
  };
}

/**
 * Submits checkout from UI forms or API handlers, invoking createOrder and returning
 * a friendly, structured result.
 */
export async function submitCheckout(
  supabase: SupabaseClient<Database>,
  identifier: CartIdentifier,
  input: CheckoutInput,
  options?: { ipAddress?: string | null }
): Promise<CheckoutSubmissionResult> {
  const result = await createOrder(supabase, input, {
    profileId: identifier.profileId,
    guestToken: identifier.guestToken,
    ipAddress: options?.ipAddress,
  });

  return {
    success: true,
    message: "Order placed successfully!",
    order: result,
  };
}

/**
 * Cron / background worker: expires pending online orders whose 15-minute reservation window has passed,
 * releasing stock atomically via release_order_stock.
 */
export async function expirePendingOnlineOrders(): Promise<{ expiredCount: number }> {
  const adminClient = createAdminClient();
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: expiredOrders, error } = await adminClient
    .from("orders")
    .select("id, order_number, profile_id, guest_email, guest_phone")
    .neq("payment_method", "cod")
    .eq("payment_status", "pending")
    .lt("created_at", fifteenMinutesAgo);

  if (error || !expiredOrders) {
    return { expiredCount: 0 };
  }

  let count = 0;
  for (const order of expiredOrders) {
    const { error: releaseErr } = await adminClient.rpc("release_order_stock", {
      p_order_id: order.id,
      p_reason: "Online payment reservation expired after 15 minutes",
    });
    if (!releaseErr) {
      count++;
      await notifyOrderCancellation({
        orderNumber: order.order_number,
        subOrderId: order.id,
        sellerId: "all_sellers",
        customerProfileId: order.profile_id,
        customerEmail: order.guest_email,
        customerPhone: order.guest_phone,
        cancelledBy: "system",
        reason: "Online payment reservation expired after 15 minutes",
      });
    }
  }

  return { expiredCount: count };
}

/**
 * Cron / background worker: expires unconfirmed COD orders whose 24-hour verification window has passed,
 * releasing stock atomically via release_order_stock.
 */
export async function expireUnconfirmedCodOrders(): Promise<{ expiredCount: number }> {
  const adminClient = createAdminClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: unconfirmedOrders, error } = await adminClient
    .from("orders")
    .select("id, order_number, profile_id, guest_email, guest_phone")
    .eq("payment_method", "cod")
    .lt("created_at", twentyFourHoursAgo);

  if (error || !unconfirmedOrders) {
    return { expiredCount: 0 };
  }

  let count = 0;
  for (const order of unconfirmedOrders) {
    // Check if sub_orders are still awaiting_confirmation
    const { data: pendingSubOrders } = await adminClient
      .from("sub_orders")
      .select("id, seller_id")
      .eq("order_id", order.id)
      .eq("status", "awaiting_confirmation");

    if (pendingSubOrders && pendingSubOrders.length > 0) {
      const { error: releaseErr } = await adminClient.rpc("release_order_stock", {
        p_order_id: order.id,
        p_reason: "COD confirmation expired after 24 hours",
      });
      if (!releaseErr) {
        count++;
        for (const sub of pendingSubOrders) {
          await notifyOrderCancellation({
            orderNumber: order.order_number,
            subOrderId: sub.id,
            sellerId: sub.seller_id,
            customerProfileId: order.profile_id,
            customerEmail: order.guest_email,
            customerPhone: order.guest_phone,
            cancelledBy: "system",
            reason: "COD confirmation expired after 24 hours",
          });
        }
      }
    }
  }

  return { expiredCount: count };
}
