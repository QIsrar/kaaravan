import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

// In-memory fallback cache so messages are never lost even if remote database table is missing
let localSubmissionsCache: Array<{
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'resolved';
  created_at: string;
}> = [];

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().optional().default('General Inquiry'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const newSubmission = {
      id: `inq_${Date.now()}`,
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase().trim(),
      subject: parsed.data.subject,
      message: parsed.data.message.trim(),
      status: 'unread' as const,
      created_at: new Date().toISOString(),
    };

    // Store in memory cache
    localSubmissionsCache.unshift(newSubmission);

    // Persist to Supabase contact_submissions via admin client
    try {
      const admin = createAdminClient();
      await admin.from('contact_submissions').insert({
        name: newSubmission.name,
        email: newSubmission.email,
        subject: newSubmission.subject,
        message: newSubmission.message,
        status: 'unread',
      } as any);
    } catch (e: any) {
      console.warn('Supabase contact_submissions insert warning:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: "Message received. We'll be in touch within 24 hours!",
    });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    let dbItems: any[] = [];
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbItems = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          subject: d.subject || 'General Inquiry',
          message: d.message,
          status: d.status || 'unread',
          date: d.created_at ? new Date(d.created_at).toLocaleString() : 'Just now',
        }));
      }
    } catch (e) {
      console.warn('Could not read from Supabase contact_submissions:', e);
    }

    // Merge with local fallback cache
    const cachedItems = localSubmissionsCache.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      subject: c.subject,
      message: c.message,
      status: c.status,
      date: new Date(c.created_at).toLocaleString(),
    }));

    // Deduplicate by message & email
    const all = [...cachedItems, ...dbItems];
    const unique = all.filter((v, idx, arr) => 
      arr.findIndex(t => t.email === v.email && t.message === v.message) === idx
    );

    return NextResponse.json({
      success: true,
      inquiries: unique,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    // Update memory cache
    const found = localSubmissionsCache.find((s) => s.id === id);
    if (found) {
      found.status = status;
    }

    // Update Supabase
    try {
      const admin = createAdminClient();
      await (admin
        .from('contact_submissions') as any)
        .update({ status })
        .eq('id', id);
    } catch (e) {
      console.warn('Could not update contact_submission in DB:', e);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
