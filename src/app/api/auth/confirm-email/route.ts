import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    try {
      const admin = createAdminClient();
      const { data: { users }, error: listError } = await admin.auth.admin.listUsers();

      if (listError) {
        return NextResponse.json({ error: listError.message }, { status: 500 });
      }

      const targetUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const { error: updateError } = await admin.auth.admin.updateUserById(targetUser.id, {
        email_confirm: true,
      });

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Email confirmed successfully' });
    } catch (adminErr: any) {
      // Fallback if admin key is not configured in local environment
      return NextResponse.json({
        success: false,
        fallback: true,
        message: 'Admin auto-confirm unavailable, please check your email inbox.',
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
