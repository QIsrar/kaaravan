/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/
import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCachedAuthUser, type UserProfile } from "./roles";
import { getApiAuthUser } from "./api-auth";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/validators/admin";

export { ADMIN_PERMISSIONS, type AdminPermission };

/**
 * Checks server-side whether a specific user has the required admin permission.
 * Superadmin always bypasses permission checks.
 */
export async function checkAdminPermission(
  userId: string,
  userRole: string,
  permission: AdminPermission
): Promise<boolean> {
  if (userRole === "superadmin") {
    return true;
  }
  if (userRole !== "admin_staff") {
    return false;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("admin_permissions")
    .select("id")
    .eq("profile_id", userId)
    .eq("permission", permission)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Returns all admin permissions assigned to a user.
 * Superadmin returns all ADMIN_PERMISSIONS.
 */
export async function getAdminUserPermissions(
  userId: string,
  userRole: string
): Promise<AdminPermission[]> {
  if (userRole === "superadmin") {
    return [...ADMIN_PERMISSIONS];
  }
  if (userRole !== "admin_staff") {
    return [];
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("admin_permissions")
    .select("permission")
    .eq("profile_id", userId);

  if (error || !data) {
    return [];
  }

  return data.map((d) => d.permission as AdminPermission);
}

/**
 * Inspects Supabase MFA (TOTP) status for an authenticated admin session.
 * Returns:
 * - 'verified': session is currently aal2
 * - 'needs_verification': user has a verified factor enrolled, but session is aal1
 * - 'needs_enrolment': user has not yet enrolled any verified TOTP factor
 */
export async function getAdminMfaStatus(): Promise<"verified" | "needs_verification" | "needs_enrolment"> {
  const supabase = await createClient();
  const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError || !aalData) {
    return "needs_enrolment";
  }

  if (aalData.currentLevel === "aal2") {
    return "verified";
  }

  const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
  if (factorError || !factorData) {
    return "needs_enrolment";
  }

  const hasVerifiedFactor = (factorData.totp || []).some(
    (factor) => factor.status === "verified"
  );

  return hasVerifiedFactor ? "needs_verification" : "needs_enrolment";
}

/**
 * Server-side gate for admin routes.
 * Enforces:
 * 1. Active profile (suspended profiles refused and signed out).
 * 2. Role is 'superadmin' or 'admin_staff'.
 * 3. User holds the declared permission (superadmin passes everything).
 * 4. MFA enforcement (session must be aal2; redirects to enrollment or verification if not).
 */
export async function requireAdminPermission(
  permission: AdminPermission,
  options?: { skipMfaCheck?: boolean }
): Promise<UserProfile> {
  const authState = await getCachedAuthUser();

  if (!authState || !authState.user || !authState.profile) {
    redirect("/login?redirect=/admin");
  }

  const { user, profile } = authState;
  const role = profile.role;

  if (profile.status === "suspended") {
    redirect("/login");
  }

  if (role !== "superadmin" && role !== "admin_staff") {
    redirect("/unauthorized");
  }

  // Permission check
  const hasPermission = await checkAdminPermission(user.id, role, permission);
  if (!hasPermission) {
    redirect("/unauthorized");
  }

  // MFA enforcement (aal2 required for all /admin routes)
  if (!options?.skipMfaCheck) {
    const mfaStatus = await getAdminMfaStatus();
    if (mfaStatus === "needs_enrolment") {
      redirect("/admin/mfa/enroll");
    } else if (mfaStatus === "needs_verification") {
      redirect("/admin/mfa");
    }
  }

  return {
    id: user.id,
    email: user.email ?? null,
    role: role as UserProfile["role"],
    fullName: profile.full_name ?? null,
    phone: profile.phone ?? null,
  };
}

/**
 * API route guard for /api/v1/admin/* endpoints.
 * Returns either authenticated user/profile or a NextResponse error (401/403).
 */
export async function requireApiAdminPermission(
  permission: AdminPermission
): Promise<
  | { success: true; user: { id: string; email?: string | null }; profile: UserProfile }
  | { success: false; response: NextResponse }
> {
  const authUser = await getApiAuthUser();

  if (authUser.error || !authUser.user || !authUser.supabase) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  // Enforce MFA AAL2 on administrative REST API endpoints
  const { data: aalData, error: aalError } =
    await authUser.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || aalData?.currentLevel !== "aal2") {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden: Two-factor authentication (AAL2) verification required." },
        { status: 403 }
      ),
    };
  }

  const user = authUser.user;

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, full_name, phone, status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.status === "suspended") {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Access denied. Profile inactive or suspended." },
        { status: 403 }
      ),
    };
  }

  const role = profile.role;
  if (role !== "superadmin" && role !== "admin_staff") {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden: Administrative access required" },
        { status: 403 }
      ),
    };
  }

  const hasPerm = await checkAdminPermission(user.id, role, permission);
  if (!hasPerm) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: `Forbidden: Missing required permission '${permission}'` },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    user,
    profile: {
      id: profile.id,
      email: user.email ?? null,
      role: role as UserProfile["role"],
      fullName: profile.full_name ?? null,
      phone: profile.phone ?? null,
    },
  };
}

