import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    try {
      const admin = createAdminClient();

      // Create user with email_confirm: true — completely bypassing verification!
      const { data, error } = await admin.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName?.trim() || '',
        },
      });

      if (error) {
        // If user already registered, ensure they are confirmed
        if (
          error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already exists')
        ) {
          const { data: { users } } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const existing = users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
          if (existing) {
            await admin.auth.admin.updateUserById(existing.id, {
              email_confirm: true,
              password,
            });
            return NextResponse.json({
              success: true,
              message: 'Account updated and confirmed',
              userId: existing.id,
            });
          }
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Account created with instant email confirmation',
        userId: data.user.id,
      });
    } catch (adminErr: any) {
      // If service role not configured, return fallback
      return NextResponse.json(
        {
          success: false,
          fallback: true,
          message: adminErr.message || 'Admin signup unavailable',
        },
        { status: 200 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
