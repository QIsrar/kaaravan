"use server";

import { requireAuth } from "@/lib/auth/roles";
import { getSellerOrderDetails, getSellerOrders } from "@/lib/services/seller-orders";
import { changeSubOrderStatus, SubOrderStatus } from "@/lib/services/order-status";
import { headers } from "next/headers";

export async function getSellerOrdersAction(status: SubOrderStatus | "all", search: string, page: number) {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");
  return getSellerOrders(profile.id, { status, search, page, limit: 20 });
}

export async function getSellerOrderDetailsAction(subOrderId: string) {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");
  return getSellerOrderDetails(profile.id, subOrderId);
}

export async function changeSellerOrderStatusAction(subOrderId: string, newStatus: SubOrderStatus, reason?: string) {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");
  
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || "127.0.0.1";

  await changeSubOrderStatus(subOrderId, newStatus, profile.id, "seller", ipAddress, reason);
  return { success: true };
}
