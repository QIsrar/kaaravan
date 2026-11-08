import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { updateStaffPermissions } from "@/lib/services/admin-staff";
import { adminPermissionSchema } from "@/lib/validators/admin";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();
const permissionsSchema = z.object({
  permissions: z.array(adminPermissionSchema),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_users");
  if (!auth.success) return auth.response;

  if (auth.profile.role !== "superadmin") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Superadmin role required" },
      { status: 403 }
    );
  }

  const { id: rawId } = await context.params;
  const parsedId = uuidSchema.safeParse(rawId);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid UUID parameter" }, { status: 400 });
  }
  const targetProfileId = parsedId.data;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = permissionsSchema.parse(body);

    const result = await updateStaffPermissions(targetProfileId, validated.permissions, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update staff permissions" },
      { status: 400 }
    );
  }
}
