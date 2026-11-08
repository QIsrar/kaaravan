import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { getSellerOrderDetails } from "@/lib/services/seller-orders";
import { uuidSchema } from "@/lib/validators/seller-catalog";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: profile } = await getApiAuthUser();
    if (!profile) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const parsedId = uuidSchema.parse(id);
    const result = await getSellerOrderDetails(profile.id, parsedId);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error("GET /sellers/orders/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to load order details" }, { status: 400 });
  }
}
