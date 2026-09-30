import { NextResponse } from "next/server";
import { removeFromWishlist } from "@/lib/services/customer_accounts";
import { getApiAuthUser } from "@/lib/auth/api-auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ variantId: string }> }) {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });
    const { variantId } = await params;
    await removeFromWishlist(supabase, user.id, variantId);
    return NextResponse.json({ success: true, message: "Removed from wishlist" });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
