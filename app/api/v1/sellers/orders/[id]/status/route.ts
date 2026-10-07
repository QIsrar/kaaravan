/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { changeSubOrderStatus, SubOrderStatus } from "@/lib/services/order-status";

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
    const body = await request.json();
    const newStatus = body.status as SubOrderStatus;
    const reason = body.reason;

    if (!newStatus) {
      return NextResponse.json({ success: false, error: "Missing status" }, { status: 400 });
    }

    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";

    await changeSubOrderStatus(id, newStatus, profile.id, "seller", ipAddress, reason);

    return NextResponse.json({ success: true, message: "Status updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
