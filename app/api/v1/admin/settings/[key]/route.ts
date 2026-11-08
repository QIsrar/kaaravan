import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { updateAdminSetting } from "@/lib/services/admin-settings";
import { getClientIp } from "@/lib/utils";

const settingUpdateSchema = z.object({
  value: z.unknown().optional(),
  isPublic: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  const auth = await requireApiAdminPermission("manage_settings");
  if (!auth.success) return auth.response;

  const { key: rawKey } = await context.params;
  const key = z.string().trim().min(1).max(100).parse(rawKey);
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = settingUpdateSchema.parse(body);

    const result = await updateAdminSetting(key, validated, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update setting" },
      { status: 400 }
    );
  }
}
