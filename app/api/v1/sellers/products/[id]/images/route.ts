import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { uploadProductImage } from "@/lib/services/seller-products";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const productId = (await params).id;
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Missing file" }, { status: 400 });
    }

    const result = await uploadProductImage(
      sellerId,
      productId,
      file,
      profileId,
      ipAddress
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 400 });
  }
}
