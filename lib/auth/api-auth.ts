/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/
import "server-only";
import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export async function getApiAuthUser() {
  const reqHeaders = await headers();
  const authHeader = reqHeaders.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (!token) return { user: null, supabase: null, error: "Invalid token format" };
    
    const supabaseBearer = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() {}
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error: userError } = await supabaseBearer.auth.getUser(token);
    if (user && !userError) {
      return { user, supabase: supabaseBearer, error: null };
    }
    return { user: null, supabase: null, error: "Invalid or expired access token" };
  }

  // Fallback to cookie-based session for web clients calling the API
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (user && !error) {
    return { user, supabase, error: null };
  }

  return { user: null, supabase: null, error: "Unauthorized" };
}
