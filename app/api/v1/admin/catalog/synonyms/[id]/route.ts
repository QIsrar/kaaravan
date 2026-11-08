import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { deleteAdminSynonym } from "@/lib/services/admin-catalog";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_catalog");
  if (!auth.success) return auth.response;

  const { id: rawId } = await context.params;
  const parsedId = uuidSchema.safeParse(rawId);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid UUID parameter" }, { status: 400 });
  }
  const synonymId = parsedId.data;
  const ipAddress = getClientIp(request.headers);

  try {
    const result = await deleteAdminSynonym(synonymId, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to delete synonym" },
      { status: 400 }
    );
  }
}
