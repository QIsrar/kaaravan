import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { rejectProduct } from "@/lib/services/admin-catalog";
import { rejectProductSchema } from "@/lib/validators/admin";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_catalog");
  if (!auth.success) return auth.response;

  const { id: rawId } = await context.params;
  const parsed = uuidSchema.safeParse(rawId);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid UUID parameter" }, { status: 400 });
  }
  const productId = parsed.data;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = rejectProductSchema.parse(body);

    await rejectProduct(productId, validated.reason, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json({ success: true, message: "Product rejected successfully" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to reject product" },
      { status: 400 }
    );
  }
}
