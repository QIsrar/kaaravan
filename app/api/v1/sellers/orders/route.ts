/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { getSellerOrders } from "@/lib/services/seller-orders";
import { SubOrderStatus } from "@/lib/services/order-status";

export async function GET(request: Request) {
  try {
    const { user: profile } = await getApiAuthUser();
    if (!profile) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "all") as SubOrderStatus | "all";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getSellerOrders(profile.id, { status, search, page, limit });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
