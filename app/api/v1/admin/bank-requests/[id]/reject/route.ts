import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { rejectBankChangeRequest } from "@/lib/services/admin-finance";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_finance");
  if (!auth.success) return auth.response;

  const { id: rawId } = await context.params;
  const parsed = uuidSchema.safeParse(rawId);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid UUID parameter" }, { status: 400 });
  }
  const requestId = parsed.data;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const reason = z.string().trim().min(5, "Rejection reason must be at least 5 characters").max(500).parse(body?.reason);

    await rejectBankChangeRequest(requestId, reason, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json({ success: true, message: "Bank change request rejected" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to reject bank change request" },
      { status: 400 }
    );
  }
}
