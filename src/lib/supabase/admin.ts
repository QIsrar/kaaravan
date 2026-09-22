import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Service-role Supabase client — bypasses RLS.
 * USE ONLY in:
 *   - Stripe webhook handlers (src/app/api/webhooks/stripe/route.ts)
 *   - Server-side operations that require elevated privileges
 *
 * NEVER import this in client components or expose to the browser.
 */
import { getSanitizedSupabaseUrl } from './client';

export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawUrl || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. ' +
      'These must be set in .env.local for server-side operations.'
    );
  }

  const supabaseUrl = getSanitizedSupabaseUrl(rawUrl);

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
