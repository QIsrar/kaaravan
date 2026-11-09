import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { approveAdminPayout } from "@/lib/services/payouts";
import { approvePayoutSchema } from "@/lib/validators/admin";
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
    const validated = approvePayoutSchema.parse(body);
    const ipAddress = getClientIp(request.headers);

    const result = await approveAdminPayout({
      payoutId,
      adminId: user.id,
      adminRole: user.role,
      bankReference: validated.bankReference,
      ipAddress,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 400 }
    );
  }
}

