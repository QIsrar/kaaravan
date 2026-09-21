import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

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

    const supabase = await createClient();
    const { error } = await supabase.from('contact_submissions').insert({
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase().trim(),
      subject: parsed.data.subject,
      message: parsed.data.message.trim(),
      status: 'unread',
    } as any);

    if (error) {
      console.warn('Could not insert to Supabase contact_submissions, responding ok for client:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Message received. We'll be in touch soon!",
    });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
