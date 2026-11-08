import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { setSellerCommission } from "@/lib/services/admin-sellers";
import { setSellerCommissionSchema } from "@/lib/validators/admin";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();

export async function PATCH(
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
    const validated = setSellerCommissionSchema.parse(body);

    await setSellerCommission(sellerId, validated.commissionRateBps, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json({ success: true, message: "Seller commission updated successfully" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update seller commission" },
      { status: 400 }
    );
  }
}
