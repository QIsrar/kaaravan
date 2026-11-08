import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { approveBankChangeRequest } from "@/lib/services/admin-finance";
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
    let note: string | undefined;
    try {
      const body = await request.json();
      note = body?.note;
    } catch {
      // Body is optional
    }

    await approveBankChangeRequest(requestId, auth.user.id, auth.profile.role, ipAddress, note);
    return NextResponse.json({ success: true, message: "Bank change request approved" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to approve bank change request" },
      { status: 400 }
    );
  }
}
