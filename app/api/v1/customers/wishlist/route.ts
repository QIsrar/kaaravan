import { NextResponse } from "next/server";
import { getWishlist, addToWishlist } from "@/lib/services/customer_accounts";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { postgresUuidSchema } from "@/lib/validators/cart";

export async function GET() {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });
    const data = await getWishlist(supabase, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });
    const { variantId } = await req.json();
    const validatedId = postgresUuidSchema.parse(variantId);

    await addToWishlist(supabase, user.id, validatedId);
    return NextResponse.json({ success: true, message: "Added to wishlist" });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
