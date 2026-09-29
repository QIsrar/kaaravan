/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/
import "server-only";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CartIdentifier } from "@/lib/services/cart";

export const GUEST_COOKIE_NAME = "guest_token";

const uuidSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);

function isValidUuid(val: string | undefined | null): val is string {
  if (!val) return false;
  return uuidSchema.safeParse(val.trim()).success;
}

export interface CartSessionResult {
  identifier: CartIdentifier;
  newGuestToken?: string;
  invalidBearerToken?: boolean;
}

/**
 * Resolves whether the current request is from an authenticated user or guest.
 * Works seamlessly across both web (cookies) and mobile API (headers).
 */
export async function getCartIdentifier(createGuestIfMissing = false): Promise<CartSessionResult> {
  const reqHeaders = await headers();
  const reqCookies = await cookies();

  // 1. Check Bearer token first (Mobile / API clients)
  const authHeader = reqHeaders.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (!token) {
      return { identifier: {}, invalidBearerToken: true };
    }
    const adminClient = createAdminClient();
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
    if (user && !userError) {
      return { identifier: { profileId: user.id } };
    }
    // Bearer header was present but is invalid or expired
    return { identifier: {}, invalidBearerToken: true };
  }

  // 2. Check Supabase server session (Web cookies)
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return { identifier: { profileId: user.id } };
    }
  } catch {
    // Continue to guest check
  }

  // 3. Check X-Guest-Token header (Mobile guest flow) - validate as UUID
  const headerGuestToken = reqHeaders.get("x-guest-token");
  if (isValidUuid(headerGuestToken)) {
    return { identifier: { guestToken: headerGuestToken.trim() } };
  }

  // 4. Check guest_token cookie (Web guest flow) - validate as UUID
  const cookieGuestToken = reqCookies.get(GUEST_COOKIE_NAME)?.value;
  if (isValidUuid(cookieGuestToken)) {
    return { identifier: { guestToken: cookieGuestToken.trim() } };
  }

  // 5. Generate new guest token if requested
  if (createGuestIfMissing) {
    const newToken = crypto.randomUUID();
    try {
      reqCookies.set(GUEST_COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    } catch {
      // If called in a context where cookies cannot be set (e.g. read-only server component),
      // we still return the generated token.
    }
    return {
      identifier: { guestToken: newToken },
      newGuestToken: newToken,
    };
  }

  return { identifier: {} };
}
