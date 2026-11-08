import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { promoteToAdminStaff } from "@/lib/services/admin-staff";
import { getClientIp } from "@/lib/utils";

const promoteSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiAdminPermission("manage_users");
  if (!auth.success) return auth.response;

  if (auth.profile.role !== "superadmin") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Superadmin role required" },
      { status: 403 }
    );
  }

  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = promoteSchema.parse(body);

    const result = await promoteToAdminStaff(validated.email, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to promote staff member" },
      { status: 400 }
    );
  }
}
