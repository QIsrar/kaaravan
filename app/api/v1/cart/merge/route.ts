import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCartIdentifier } from "@/lib/auth/cart-session";
import { mergeGuestCart, getCartDetails } from "@/lib/services/cart";
import { mergeCartSchema } from "@/lib/validators/cart";

export async function POST(req: NextRequest) {
  try {
    const session = await getCartIdentifier(false);
    if (session.invalidBearerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or expired access token" },
        { status: 401 }
      );
    }
    if (!session.identifier.profileId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to merge guest cart" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { guestToken } = mergeCartSchema.parse(body);

    const adminClient = createAdminClient();
    const result = await mergeGuestCart(adminClient, guestToken, session.identifier.profileId);
    const updatedCart = await getCartDetails(adminClient, { profileId: session.identifier.profileId });

    return NextResponse.json({
      success: true,
      mergedCount: result.mergedCount,
      skippedCount: result.skippedCount,
      data: updatedCart,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to merge cart";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 400 }
    );
  }
}
