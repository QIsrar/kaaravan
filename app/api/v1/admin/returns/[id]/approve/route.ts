import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { approveReturnAndRefund } from "@/lib/services/returns";
import { approveReturnSchema } from "@/lib/validators/admin";
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

    const { id: returnId } = await params;
    const body = await request.json().catch(() => ({}));
    const validated = approveReturnSchema.parse(body);
    const ipAddress = getClientIp(request.headers);

    const result = await approveReturnAndRefund({
      returnId,
      actorId: user.id,
      actorRole: user.role,
      ipAddress,
      note: validated.note,
      customerPayoutDetails: validated.customerPayoutDetails,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 400 }
    );
  }
}

