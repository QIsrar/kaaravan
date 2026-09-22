import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function getSanitizedSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return 'https://placeholder.supabase.co';
  return rawUrl.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

export function createClient() {
  const url = getSanitizedSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';
  return createBrowserClient<Database>(url, key);
}
