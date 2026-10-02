import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { productUpsertSchema } from "@/lib/validators/seller-catalog";
import { upsertSellerProduct } from "@/lib/services/seller-products";

export async function POST(req: Request) {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: authError || "Unauthorized" }, { status: 401 });
    }

    const { data: seller } = await supabase
      .from("sellers")
      .select("id, status")
      .eq("owner_profile_id", user.id)
      .single();

    if (!seller || seller.status !== "approved") {
      return NextResponse.json({ success: false, error: "Only approved sellers can manage products" }, { status: 403 });
    }

    const profileId = user.id;
    const sellerId = seller.id;

    const body = await req.json();
    const validatedData = productUpsertSchema.parse(body);
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";

    const result = await upsertSellerProduct(
      sellerId,
      profileId,
      ipAddress,
      validatedData
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("API POST error:", err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 400 });
  }
}
