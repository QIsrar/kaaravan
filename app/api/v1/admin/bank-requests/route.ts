import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { listBankChangeRequests } from "@/lib/services/admin-finance";

export async function GET(request: NextRequest) {
  const auth = await requireApiAdminPermission("manage_finance");
  if (!auth.success) return auth.response;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") as "pending" | "approved" | "rejected" | null;

  try {
    const data = await listBankChangeRequests(
      auth.user.id,
      auth.profile.role,
      statusParam ?? undefined
    );
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load requests" },
      { status: 400 }
    );
  }
}

