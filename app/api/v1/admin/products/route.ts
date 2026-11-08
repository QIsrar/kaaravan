import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { listModerationQueue } from "@/lib/services/admin-catalog";

export async function GET(request: NextRequest) {
  const auth = await requireApiAdminPermission("manage_catalog");
  if (!auth.success) return auth.response;

  const url = new URL(request.url);
  const statusParam = (url.searchParams.get("status") || "pending_review") as
    | "pending_review"
    | "active"
    | "rejected"
    | "archived";

  try {
    const data = await listModerationQueue(auth.user.id, auth.profile.role, statusParam);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load moderation queue" },
      { status: 400 }
    );
  }
}

