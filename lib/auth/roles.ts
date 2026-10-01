/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "superadmin" | "admin_staff" | "seller" | "customer" | "guest";

export interface UserProfile {
  id: string;
  email: string | null;
  role: UserRole;
  fullName?: string | null;
  phone?: string | null;
  seller_id?: string | null;
  seller_business_name?: string | null;
}

interface CachedAuthState {
  user: { id: string; email?: string | null };
  profile: { role: UserRole; full_name?: string | null; phone?: string | null; status?: string };
  seller: { id: string; business_name: string; status: string; deleted_at: string | null } | null;
}

/**
 * Per-request memoized lookup of authenticated user identity and profile.
 * React cache() guarantees this only queries Supabase once per request,
 * sharing the result between root layout, account layout, and leaf pages.
 */
export const getCachedAuthUser = cache(async (): Promise<CachedAuthState | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, full_name, phone, status")
    .eq("id", user.id)
    .single();

  if (!profileData || profileData.status === "suspended") {
    if (profileData?.status === "suspended") {
      await supabase.auth.signOut();
    }
    return null;
  }

  let seller = null;
  if (profileData.role === "seller") {
    const { data: sellerData } = await supabase
      .from("sellers")
      .select("id, business_name, status, deleted_at")
      .eq("owner_profile_id", user.id)
      .maybeSingle();
    seller = sellerData;
  }

  return {
    user: { id: user.id, email: user.email },
    profile: profileData,
    seller,
  };
});

/**
 * Server-side role verification for layouts and server actions.
 * Defense-in-depth: Middleware handles fast routing redirects, but server layouts
 * and server actions MUST independently verify identity and role.
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<UserProfile> {
  return requireRole(allowedRoles || []);
}

/**
 * Validates that the current user has one of the allowed roles.
 * Must only be called from server components, server actions, or route handlers.
 * Redirects to login or unauthorized if requirements are not met.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<UserProfile> {
  const authState = await getCachedAuthUser();

  if (!authState || !authState.user || !authState.profile) {
    redirect("/login");
  }

  const { user, profile: profileData, seller: sellerData } = authState;
  const role = profileData.role as UserRole;

  let seller_id = null;
  if (role === "seller") {
    if (sellerData) {
      if (allowedRoles && allowedRoles.includes("seller")) {
        if (sellerData.status !== "approved" || sellerData.deleted_at !== null) {
          redirect("/unauthorized");
        }
      }
      seller_id = sellerData.id;
    } else {
      if (allowedRoles && allowedRoles.includes("seller")) {
        redirect("/unauthorized");
      }
    }
  }

  const profile: UserProfile = {
    id: user.id,
    email: user.email ?? null,
    role,
    fullName: profileData.full_name ?? null,
    phone: profileData.phone ?? null,
    seller_id,
    seller_business_name: sellerData?.business_name ?? null,
  };

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If authenticated but unauthorized for this portal
    if (role === "seller" && !allowedRoles.includes("seller")) {
      redirect("/seller");
    } else if (role === "superadmin" && !allowedRoles.includes("superadmin")) {
      redirect("/admin");
    } else {
      redirect("/unauthorized");
    }
  }

  return profile;
}

export interface SellerPortalStatus {
  role: UserRole;
  email: string | null;
  fullName: string | null;
  isApprovedSeller: boolean;
}

/**
 * Non-redirecting lookup of the current visitor's role, used purely for UI
 * decisions (e.g. which seller-portal link to show, the header user menu).
 * Never redirects and never throws for guests, unlike requireAuth/requireRole.
 */
export async function getOptionalUserRole(): Promise<SellerPortalStatus | null> {
  const authState = await getCachedAuthUser();
  if (!authState || !authState.user || !authState.profile) return null;

  const { user, profile: profileData, seller: sellerData } = authState;
  const role = profileData.role as UserRole;
  const email = user.email ?? null;
  const fullName = profileData.full_name ?? null;

  if (role !== "seller") {
    return { role, email, fullName, isApprovedSeller: false };
  }

  const isApprovedSeller = Boolean(
    sellerData && sellerData.status === "approved" && sellerData.deleted_at === null
  );
  return { role, email, fullName, isApprovedSeller };
}

/**
 * Approved sellers go straight to their portal; everyone else (guests,
 * customers, pending sellers) goes to the public "become a seller" page.
 * Prevents the /seller -> /login -> /unauthorized loop for non-sellers.
 */
export function getSellerPortalHref(status: SellerPortalStatus | null): "/seller" | "/sell" {
  return status?.isApprovedSeller ? "/seller" : "/sell";
}
