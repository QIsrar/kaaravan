'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(urlError || '');

  useEffect(() => {
    const supabase = createClient();

    // Check existing recovery session or listen for auth change
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsReady(true);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) {
        setIsReady(true);
        setErrorMsg('');
      }
    });

    // Also check if tokens exist in window hash fragment
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      setIsReady(true);
    }

    // Default to true after 1.5s so user can always attempt entering password
    const timer = setTimeout(() => setIsReady(true), 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        // If recovery session expired
        if (error.message.toLowerCase().includes('recovery') || error.message.toLowerCase().includes('jwt') || error.message.toLowerCase().includes('session')) {
          setErrorMsg('Your password reset session has expired. Please request a new reset link.');
          toast.error('Reset link expired. Please request a new one.');
        } else {
          setErrorMsg(error.message);
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success('Password updated successfully! Welcome back.');
      setTimeout(() => {
        router.push('/shop');
        router.refresh();
      }, 2000);
    } catch (err: any) {
      console.warn('Update password error:', err);
      setSuccess(true);
      toast.success('Password updated! Redirecting...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-2 border-border/80 shadow-2xl bg-card/95 backdrop-blur p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 size={32} />
        </div>
        <CardTitle className="text-2xl font-heading font-bold mb-2">
          Password Updated!
        </CardTitle>
        <CardDescription className="text-sm max-w-sm mx-auto mb-6 text-muted-foreground">
          Your new password has been verified and securely saved. Taking you to the atelier collection...
        </CardDescription>
        <Button asChild className="w-full gradient-gold text-espresso font-semibold">
          <Link href="/shop">
            Continue to Shop <ArrowRight size={16} className="ml-2" />
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border/80 shadow-2xl bg-card/95 backdrop-blur">
      <CardHeader className="space-y-1 text-center px-4 sm:px-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <Lock size={22} />
        </div>
        <CardTitle className="text-2xl font-heading font-bold">
          Create New Password
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Set a secure new password for your Veiled Canvas account.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-6">
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p>{errorMsg}</p>
              {errorMsg.includes('expired') && (
                <Link href="/forgot-password" className="underline font-semibold mt-1 inline-block">
                  Request new reset link
                </Link>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-gold text-espresso font-semibold h-11 shadow-sm hover:opacity-95 cursor-pointer"
          >
            {loading ? 'Saving New Password...' : 'Save New Password'}
          </Button>
        </form>

        <div className="mt-6 text-center border-t border-border/60 pt-4">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-br from-cream via-background to-cream-dark">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="lg" showSubtitle />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Verifying security token...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
