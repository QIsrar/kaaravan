import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "superadmin" | "seller" | "customer" | "guest";

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
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Retrieve user role from database/metadata. In Phase 1 foundation:
  // We check user_metadata.role or public.profiles role if available.
  const role = (user.user_metadata?.role as UserRole) || "customer";
  const seller_id = (user.user_metadata?.seller_id as string) || null;

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
