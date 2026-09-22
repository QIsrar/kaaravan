'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role?: 'admin' | 'customer';
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      // 1. Check cookies for demo mode or admin cookie
      if (typeof document !== 'undefined') {
        const cookies = document.cookie;
        const hasDemoAdmin = cookies.includes('demo_admin=true');
        const demoUserMatch = cookies.match(/demo_user=([^;]+)/);

        if (hasDemoAdmin) {
          setUser({
            id: 'demo-admin-id',
            email: 'admin@veiledcanvas.com',
            name: 'Atelier Administrator',
            role: 'admin',
          });
          setLoading(false);
          return;
        }

        if (demoUserMatch) {
          const decodedName = decodeURIComponent(demoUserMatch[1]);
          setUser({
            id: 'demo-customer-id',
            email: 'customer@example.com',
            name: decodedName,
            role: 'customer',
          });
          setLoading(false);
          return;
        }
      }

      // 2. Check Supabase session
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: metadata.full_name || session.user.email?.split('@')[0] || 'Client',
          role: metadata.role || 'customer',
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Auth check error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    try {
      const supabase = createClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        checkAuth();
      });
      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // Ignore if supabase client unconfigured
    }
  }, [checkAuth]);

  const signOut = useCallback(async () => {
    try {
      if (typeof document !== 'undefined') {
        document.cookie = 'demo_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'demo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || (typeof document !== 'undefined' && document.cookie.includes('demo_admin=true')),
    loading,
    signOut,
    refresh: checkAuth,
  };
}
