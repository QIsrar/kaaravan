import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { toggleCouponActive } from "@/lib/services/admin-marketing";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();
const couponStatusSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_promotions");
  if (!auth.success) return auth.response;

  const { id: rawId } = await context.params;
  const parsedId = uuidSchema.safeParse(rawId);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid UUID parameter" }, { status: 400 });
  }
  const couponId = parsedId.data;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = couponStatusSchema.parse(body);

    const result = await toggleCouponActive(couponId, validated.isActive, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update coupon status" },
      { status: 400 }
    );
  }
}
