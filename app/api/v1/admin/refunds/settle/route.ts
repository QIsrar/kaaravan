import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { settleRefundDue } from "@/lib/services/returns";
import { settleRefundDueSchema } from "@/lib/validators/admin";
import { getClientIp } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { user } = await getApiAuthUser();
    if (!user || (user.role !== "superadmin" && user.role !== "admin_staff")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = settleRefundDueSchema.parse(body);
    const ipAddress = getClientIp(request.headers);

    await settleRefundDue({
      paymentId: validated.paymentId,
      bankReference: validated.bankReference,
      actorId: user.id,
      actorRole: user.role,
      ipAddress,
      note: validated.note,
    });

    return NextResponse.json({ success: true, message: "Refund-due payment settled successfully" });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 400 }
    );
  }
}

