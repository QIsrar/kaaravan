import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { updateCourierConfig } from "@/lib/services/admin-logistics";
import { getClientIp } from "@/lib/utils";

const courierStatusSchema = z.object({
  isActive: z.boolean().optional(),
  supportsCod: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_logistics");
  if (!auth.success) return auth.response;

  const { id: courierCode } = await context.params;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = courierStatusSchema.parse(body);

    const result = await updateCourierConfig(courierCode, validated, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update courier status" },
      { status: 400 }
    );
  }
}
