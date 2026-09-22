import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
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
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Check demo admin cookie fallback
    const isDemoAdminCookie = cookieStore.get('demo_admin')?.value === 'true';

    if (!user) {
      if (isDemoAdminCookie) {
        return NextResponse.json({
          authenticated: true,
          isAdmin: true,
          user: {
            id: 'demo-admin-id',
            email: 'admin@veiledcanvas.com',
            name: 'Atelier Administrator',
            role: 'admin',
          },
        });
      }
      return NextResponse.json({ authenticated: false, isAdmin: false, user: null });
    }

    let role = (user.user_metadata?.role as string) || 'customer';
    let fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Client';

    // Query profiles table via admin client to bypass any RLS restriction
    try {
      const admin = createAdminClient();
      const { data: profile } = await (admin
        .from('profiles') as any)
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        if (profile.role) role = profile.role;
        if (profile.full_name) fullName = profile.full_name;
      }

      // If user is qisrar951@gmail.com, ensure admin privileges are recognized
      if (user.email?.toLowerCase() === 'qisrar951@gmail.com') {
        role = 'admin';
        // Ensure profiles table has role = 'admin'
        await (admin.from('profiles') as any).upsert({
          id: user.id,
          role: 'admin',
          full_name: fullName,
        });
      }
    } catch (e) {
      console.warn('Profiles table check fallback:', e);
    }

    const isAdmin = role === 'admin' || isDemoAdminCookie;

    const response = NextResponse.json({
      authenticated: true,
      isAdmin,
      user: {
        id: user.id,
        email: user.email,
        name: fullName,
        role,
      },
    });

    if (isAdmin) {
      response.cookies.set('demo_admin', 'true', { path: '/', maxAge: 86400 });
      response.cookies.set('user_role', 'admin', { path: '/', maxAge: 86400 });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
