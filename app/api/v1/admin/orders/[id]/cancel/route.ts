/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { adminCancelFullOrder } from "@/lib/services/admin-orders";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();
const cancelBodySchema = z.object({
  reason: z.string().trim().min(5, "A cancellation reason of at least 5 characters is required").max(500),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_orders");
  if (!auth.success) return auth.response;

  const { id: rawId } = await context.params;
  const parsed = uuidSchema.safeParse(rawId);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid order UUID parameter" }, { status: 400 });
  }

  const orderId = parsed.data;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = cancelBodySchema.parse(body);

    const result = await adminCancelFullOrder(
      orderId,
      validated.reason,
      auth.user.id,
      auth.profile.role,
      ipAddress
    );

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully and inventory released.",
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to cancel order" },
      { status: 400 }
    );
  }
}

