import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { adminForceSubOrderStatus } from "@/lib/services/admin-orders";
import { adminOrderStatusChangeSchema } from "@/lib/validators/admin";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_orders");
  if (!auth.success) return auth.response;

  const { id: rawId } = await context.params;
  const parsed = uuidSchema.safeParse(rawId);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid UUID parameter" }, { status: 400 });
  }
  const subOrderId = parsed.data;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = adminOrderStatusChangeSchema.parse(body);

    await adminForceSubOrderStatus(
      subOrderId,
      validated.newStatus,
      validated.note,
      auth.user.id,
      auth.profile.role,
      ipAddress
    );

    return NextResponse.json({ success: true, message: "Order status updated successfully" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update order status" },
      { status: 400 }
    );
  }
}
