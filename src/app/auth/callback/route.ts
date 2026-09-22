import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const nextParam = requestUrl.searchParams.get('next');
  const redirectParam = requestUrl.searchParams.get('redirect');

  // Determine target redirect
  let targetRedirect = nextParam || redirectParam || '/';
  if (type === 'recovery' || targetRedirect.includes('reset-password')) {
    targetRedirect = '/reset-password';
  }

  if (code) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Ignore inside Route Handler
              }
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.warn('Auth callback code exchange warning:', error.message);
        if (type === 'recovery') {
          return NextResponse.redirect(new URL('/reset-password?error=' + encodeURIComponent(error.message), requestUrl.origin));
        }
      }
    } catch (err) {
      console.warn('Auth callback error:', err);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(targetRedirect, requestUrl.origin));
}
