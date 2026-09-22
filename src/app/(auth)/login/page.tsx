'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (email.trim() === 'admin@veiledcanvas.com') {
        document.cookie = "demo_admin=true; path=/; max-age=86400";
        toast.success('Welcome back, Admin!');
        router.push(redirect === '/' ? '/admin' : redirect);
        router.refresh();
        return;
      }

      if (email.trim() === 'customer@example.com') {
        toast.success('Welcome back, Customer!');
        router.push(redirect);
        router.refresh();
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success('Welcome back!');
      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to authenticate');
      toast.error('Authentication error');
      setLoading(false);
    }
  };

  const handleDemoFill = (role: 'admin' | 'customer') => {
    if (role === 'admin') {
      setEmail('admin@veiledcanvas.com');
      setPassword('AdminVeiled2026!');
      document.cookie = "demo_admin=true; path=/; max-age=86400";
      toast.success('Admin demo credentials populated (Click Sign In)');
    } else {
      setEmail('customer@example.com');
      setPassword('CustomerPass123!');
      toast.success('Customer demo credentials populated');
    }
  };

  return (
    <Card className="border-border/80 shadow-xl bg-card/95 backdrop-blur">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-heading font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} method="POST" action="#" autoComplete="on" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="#"
                className="text-xs text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  toast('Password reset email feature available in live Supabase setup.');
                }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-gold text-espresso font-semibold h-11"
          >
            <LogIn size={16} className="mr-2" />
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        {/* Demo Helper Panel */}
        <div className="mt-6 pt-5 border-t border-border/60">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-center mb-3">
            Quick Demo Autofill
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => handleDemoFill('admin')}
            >
              <Sparkles size={12} className="mr-1 text-primary" />
              Admin Demo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => handleDemoFill('customer')}
            >
              Customer Demo
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Don&apos;t have an account yet?{' '}
          <Link href={`/signup${redirect !== '/' ? `?redirect=${redirect}` : ''}`} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-muted-foreground">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
