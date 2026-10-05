import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { reorderImagesSchema } from "@/lib/validators/seller-catalog";
import { updateProductImageOrder } from "@/lib/services/seller-products";

export async function PATCH(
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

    const productId = (await params).id;
    const body = await req.json();
    const validatedData = reorderImagesSchema.parse(body);

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    await updateProductImageOrder(
      seller.id,
      productId,
      validatedData.orderedImageIds,
      user.id,
      ipAddress
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 400 });
  }
}
