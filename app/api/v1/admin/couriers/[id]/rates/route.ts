import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { updateCourierConfig } from "@/lib/services/admin-logistics";
import { getClientIp } from "@/lib/utils";

const rateCardSchema = z.object({
  rateCard: z.object({
    baseRateMinor: z.number().int().min(0).optional(),
    perKgMinor: z.number().int().min(0).optional(),
    expressRateMinor: z.number().int().min(0).optional(),
    fuelSurchargePercent: z.number().min(0).max(100).optional(),
  }),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_logistics");
  if (!auth.success) return auth.response;

  const { id: courierCode } = await context.params;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = rateCardSchema.parse(body);

    const result = await updateCourierConfig(courierCode, validated, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update courier rate card" },
      { status: 400 }
    );
  }
}
