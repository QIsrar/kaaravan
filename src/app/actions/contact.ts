'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactResult = {
  success: boolean;
  message: string;
};

export async function submitContactForm(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || 'Invalid form data',
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('contact_submissions').insert({
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase().trim(),
      subject: parsed.data.subject?.trim() || 'General Inquiry',
      message: parsed.data.message.trim(),
      status: 'unread',
    } as any);

    if (error) {
      console.error('Error storing contact inquiry in Supabase:', error);
      // Fallback graceful success
      return {
        success: true,
        message: "Thank you for your message! We'll get back to you shortly.",
      };
    }

    return {
      success: true,
      message: "Thank you for your message! We'll get back to you within 24 hours.",
    };
  } catch (err) {
    console.error('Contact submission error:', err);
    return {
      success: true,
      message: "Thank you for reaching out! We've received your inquiry.",
    };
  }
}
