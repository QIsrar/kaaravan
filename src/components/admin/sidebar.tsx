'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FileText,
  Mail,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const navItems = [
  {
    label: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Orders & Fulfillment',
    href: '/admin/orders',
    icon: ShoppingBag,
  },
  {
    label: 'Catalog & Inventory',
    href: '/admin/products',
    icon: Package,
  },
  {
    label: 'Blog Content',
    href: '/admin/blog',
    icon: FileText,
  },
  {
    label: 'Customer Inbox',
    href: '/admin/inbox',
    icon: Mail,
  },
];

export function AdminSidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      document.cookie = 'demo_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
      router.push('/login');
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-full flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-border/70 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0 border border-gold/40 group-hover:scale-105 transition-transform">
              <Image
                src="/images/logo-mark.png"
                alt="Veiled Canvas"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-heading font-bold text-sm text-foreground tracking-tight block group-hover:text-primary transition-colors">
                Veiled Canvas
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-semibold flex items-center gap-1">
                <ShieldCheck size={10} /> Admin Ops
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-1.5">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-primary-foreground' : 'text-muted-foreground'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer / System Info & Sign Out */}
      <div className="p-4 border-t border-border/70 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink size={14} />
            Live Storefront
          </span>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Preview</span>
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={14} />
          Sign Out of Admin
        </button>
      </div>
    </aside>
  );
}
