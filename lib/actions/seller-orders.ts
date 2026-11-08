"use server";

import { requireAuth } from "@/lib/auth/roles";
import { getSellerOrderDetails, getSellerOrders } from "@/lib/services/seller-orders";
import { changeSubOrderStatus, SubOrderStatus } from "@/lib/services/order-status";
import { headers } from "next/headers";
import { uuidSchema } from "@/lib/validators/seller-catalog";
import { getClientIp } from "@/lib/utils";

export async function getSellerOrdersAction(status: SubOrderStatus | "all", search: string, page: number) {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");
  return getSellerOrders(profile.id, { status, search, page, limit: 20 });
}

export async function getSellerOrderDetailsAction(subOrderId: string) {
  try {
    const parsedId = uuidSchema.parse(subOrderId);
    const profile = await requireAuth(["seller"]);
    if (!profile) throw new Error("Unauthorized");
    return await getSellerOrderDetails(profile.id, parsedId);
  } catch (err: unknown) {
    console.error("getSellerOrderDetailsAction error:", err);
    throw new Error("Failed to load order details");
  }
}

export async function changeSellerOrderStatusAction(subOrderId: string, newStatus: SubOrderStatus, reason?: string) {
  try {
    const parsedId = uuidSchema.parse(subOrderId);
    const profile = await requireAuth(["seller"]);
    if (!profile) throw new Error("Unauthorized");
    
    const headersList = await headers();
    const ipAddress = getClientIp(headersList);

    await changeSubOrderStatus(parsedId, newStatus, profile.id, "seller", ipAddress, reason);
    return { success: true };
  } catch (err: unknown) {
    console.error("changeSellerOrderStatusAction error:", err);
    if (err instanceof Error && (err.message.includes("Invalid state") || err.message.includes("Order status changed"))) {
      throw err;
    }
    throw new Error("Failed to update order status");
  }
}
