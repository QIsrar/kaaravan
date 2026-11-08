import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { rejectSeller } from "@/lib/services/admin-sellers";
import { rejectSellerSchema } from "@/lib/validators/admin";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_sellers");
  if (!auth.success) return auth.response;

  const { id: rawId } = await context.params;
  const parsed = uuidSchema.safeParse(rawId);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid UUID parameter" }, { status: 400 });
  }
  const sellerId = parsed.data;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = rejectSellerSchema.parse(body);

    await rejectSeller(sellerId, validated.reason, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json({ success: true, message: "Seller rejected successfully" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to reject seller" },
      { status: 400 }
    );
  }
}
