import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCartIdentifier } from "@/lib/auth/cart-session";
import { submitCheckout } from "@/lib/services/orders";
import { checkoutSchema } from "@/lib/validators/checkout";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
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
    const validated = checkoutSchema.parse(body);

    const { identifier } = session;
    if (!identifier.profileId && !identifier.guestToken) {
      return NextResponse.json(
        { success: false, error: "No active shopping session found." },
        { status: 404 }
      );
    }

    const adminClient = createAdminClient();
    const result = await submitCheckout(adminClient, identifier, validated);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, "Checkout submission failed") },
      { status: 400 }
    );
  }
}
