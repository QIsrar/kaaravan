/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCartIdentifier } from "@/lib/auth/cart-session";
import { submitCheckout } from "@/lib/services/orders";
import { checkoutSchema } from "@/lib/validators/checkout";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * POST /api/v1/orders
 * Creates an authoritative multi-seller order from the active shopping cart and checkout input.
 * Supports authenticated customers (via Bearer token) and guest checkout (via cart guest token / cookie).
 */
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

    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    const ipAddress = rawIp ? rawIp.split(",")[0].trim() : "127.0.0.1";

    const adminClient = createAdminClient();
    const result = await submitCheckout(adminClient, identifier, validated, { ipAddress });

    const statusCode = result.order?.isIdempotent ? 200 : 201;
    return NextResponse.json({ success: true, data: result.order }, { status: statusCode });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, "Order creation failed") },
      { status: 400 }
    );
  }
}

