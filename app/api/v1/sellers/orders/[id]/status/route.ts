import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { changeSubOrderStatus, SubOrderStatus } from "@/lib/services/order-status";
import { uuidSchema } from "@/lib/validators/seller-catalog";
import { getClientIp } from "@/lib/utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: profile } = await getApiAuthUser();
    if (!profile) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const parsedId = uuidSchema.parse(id);
    const body = await request.json();
    const newStatus = body.status as SubOrderStatus;
    const reason = body.reason;

    if (!newStatus) {
      return NextResponse.json({ success: false, error: "Missing status" }, { status: 400 });
    }

    const ipAddress = getClientIp(request.headers);

    await changeSubOrderStatus(parsedId, newStatus, profile.id, "seller", ipAddress, reason);

    return NextResponse.json({ success: true, message: "Status updated successfully" });
  } catch (error: unknown) {
    console.error("PATCH /sellers/orders/[id]/status error:", error);
    let msg = "Failed to update order status";
    if (error instanceof Error && (error.message.includes("Invalid state") || error.message.includes("Order status changed"))) {
      msg = error.message;
    }
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
