import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { suspendCustomerProfile } from "@/lib/services/admin-users";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();
const suspendSchema = z.object({
  reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(500),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_users");
  if (!auth.success) return auth.response;

  const { id: rawId } = await context.params;
  const parsedId = uuidSchema.safeParse(rawId);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid UUID parameter" }, { status: 400 });
  }
  const customerId = parsedId.data;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = suspendSchema.parse(body);

    const result = await suspendCustomerProfile(customerId, validated.reason, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to suspend customer" },
      { status: 400 }
    );
  }
}
