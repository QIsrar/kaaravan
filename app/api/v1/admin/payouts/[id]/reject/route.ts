import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { rejectAdminPayout } from "@/lib/services/payouts";
import { rejectPayoutSchema } from "@/lib/validators/admin";
import { getClientIp } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getApiAuthUser();
    if (!user || (user.role !== "superadmin" && user.role !== "admin_staff")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: payoutId } = await params;
    const body = await request.json().catch(() => ({}));
    const validated = rejectPayoutSchema.parse(body);
    const ipAddress = getClientIp(request.headers);

    await rejectAdminPayout({
      payoutId,
      adminId: user.id,
      adminRole: user.role,
      reason: validated.reason,
      ipAddress,
    });

    return NextResponse.json({ success: true, message: "Payout request rejected" });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 400 }
    );
  }
}

