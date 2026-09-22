'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2, Sparkles, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback?redirect=/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        // If rate limited or unconfigured mock
        if (error.message.includes('rate') || error.message.includes('frequency')) {
          toast.error(error.message);
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }
        console.warn('Reset password error:', error.message);
      }

      setSubmitted(true);
      toast.success('Password reset instructions sent!');
    } catch (err: any) {
      console.warn('Forgot password catch:', err);
      setSubmitted(true);
      toast.success('Password reset instructions sent!');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-2 border-border/80 shadow-2xl bg-card/95 backdrop-blur p-4 sm:p-6 text-center">
        <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center text-espresso mx-auto mb-4 shadow-lg">
          <Mail size={30} />
        </div>
        <CardTitle className="text-2xl font-heading font-bold mb-2">
          Check Your Inbox
        </CardTitle>
        <CardDescription className="text-sm max-w-sm mx-auto mb-6 text-muted-foreground leading-relaxed">
          We have dispatched a secure password reset link to <strong className="text-foreground">{email}</strong>. Please click the link to configure your new credentials.
        </CardDescription>

        <div className="space-y-3">
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="w-full border-border/80 hover:bg-muted"
          >
            Send to a different email
          </Button>

          <Button
            asChild
            className="w-full gradient-gold text-espresso font-semibold"
          >
            <Link href="/login">
              Return to Sign In
            </Link>
          </Button>

          <div className="pt-4 border-t border-border/60">
            <Link
              href="/reset-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
            >
              Have a recovery token? Continue to Reset Form
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border/80 shadow-2xl bg-card/95 backdrop-blur">
      <CardHeader className="space-y-1 text-center px-4 sm:px-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <KeyRound size={22} />
        </div>
        <CardTitle className="text-2xl font-heading font-bold">
          Forgot Password
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Enter the email associated with your atelier account to receive reset instructions.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-6">
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-gold text-espresso font-semibold h-11 shadow-sm hover:opacity-95 cursor-pointer"
          >
            {loading ? 'Sending link...' : 'Send Reset Instructions'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-primary transition-colors gap-1.5 font-medium"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-br from-cream via-background to-cream-dark">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="lg" showSubtitle />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
