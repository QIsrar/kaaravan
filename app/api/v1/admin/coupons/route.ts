import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { createAdminCoupon } from "@/lib/services/admin-marketing";
import { getClientIp } from "@/lib/utils";

const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(30),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().int().min(1),
  minOrderAmountMinor: z.number().int().min(0).optional(),
  maxDiscountMinor: z.number().int().min(0).nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiAdminPermission("manage_promotions");
  if (!auth.success) return auth.response;

  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = createCouponSchema.parse(body);

    const result = await createAdminCoupon(validated, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to create coupon" },
      { status: 400 }
    );
  }
}
