import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "superadmin" | "admin_staff" | "seller" | "customer" | "guest";

export interface UserProfile {
  id: string;
  email: string | null;
  role: UserRole;
  seller_id?: string | null;
}

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
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Retrieve user role from database profiles table.
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    redirect("/login");
  }

  const role = profileData.role as UserRole;

  // For sellers, we might also want to fetch their seller_id
  let seller_id = null;
  if (role === 'seller') {
    const { data: sellerData } = await supabase
      .from("sellers")
      .select("id, status, deleted_at")
      .eq("owner_profile_id", user.id)
      .single();
      
    if (sellerData) {
      if (sellerData.status !== 'approved' || sellerData.deleted_at !== null) {
        redirect("/unauthorized");
      }
      seller_id = sellerData.id;
    } else {
      redirect("/unauthorized");
    }
  }

  const profile: UserProfile = {
    id: user.id,
    email: user.email ?? null,
    role,
    seller_id,
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
