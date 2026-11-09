import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { rejectReturn } from "@/lib/services/returns";
import { rejectReturnSchema } from "@/lib/validators/admin";
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
    const validated = rejectReturnSchema.parse(body);
    const ipAddress = getClientIp(request.headers);

    await rejectReturn({
      returnId,
      actorId: user.id,
      actorRole: user.role,
      ipAddress,
      reason: validated.reason,
    });

    return NextResponse.json({ success: true, message: "Return request rejected" });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 400 }
    );
  }
}

