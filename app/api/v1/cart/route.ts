import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCartIdentifier } from "@/lib/auth/cart-session";
import {
  getCartDetails,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "@/lib/services/cart";
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from "@/lib/validators/cart";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function GET() {
  try {
    const session = await getCartIdentifier(true);
    if (session.invalidBearerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or expired access token" },
        { status: 401 }
      );
    }
    const { identifier, newGuestToken } = session;
    const adminClient = createAdminClient();
    const cart = await getCartDetails(adminClient, identifier);

    const response = NextResponse.json({ success: true, data: cart });
    if (newGuestToken) {
      response.headers.set("X-Guest-Token", newGuestToken);
    }
    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, "Failed to retrieve cart") },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCartIdentifier(true);
    if (session.invalidBearerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or expired access token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = addToCartSchema.parse(body);

    const { identifier, newGuestToken } = session;
    const adminClient = createAdminClient();
    const result = await addToCart(adminClient, identifier, validated);

    const response = NextResponse.json({ success: true, data: result.cartDetails });
    if (newGuestToken) {
      response.headers.set("X-Guest-Token", newGuestToken);
    }
    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, "Failed to add to cart") },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCartIdentifier(false);
    if (session.invalidBearerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or expired access token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = updateCartItemSchema.parse(body);

    const { identifier } = session;
    if (!identifier.profileId && !identifier.guestToken) {
      return NextResponse.json(
        { success: false, error: "No active cart session" },
        { status: 404 }
      );
    }

    const adminClient = createAdminClient();
    const result = await updateCartItem(adminClient, identifier, validated);

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.cartDetails,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, "Failed to update item") },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCartIdentifier(false);
    if (session.invalidBearerToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or expired access token" },
        { status: 401 }
      );
    }

    const { identifier } = session;
    if (!identifier.profileId && !identifier.guestToken) {
      return NextResponse.json(
        { success: false, error: "No active cart session" },
        { status: 404 }
      );
    }

    const adminClient = createAdminClient();
    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get("variantId");

    if (variantId) {
      const validated = removeCartItemSchema.parse({ variantId });
      const result = await removeFromCart(adminClient, identifier, validated);
      return NextResponse.json({ success: true, data: result.cartDetails });
    }

    await clearCart(adminClient, identifier);
    return NextResponse.json({ success: true, message: "Cart cleared" });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, "Failed to delete item") },
      { status: 400 }
    );
  }
}
