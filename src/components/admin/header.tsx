'use client';

import { Menu, Bell, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminHeader({
  onOpenMobile,
  title,
  subtitle,
}: {
  onOpenMobile: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="h-16 border-b border-border/80 bg-card/80 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobile}
          className="lg:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu size={20} />
        </Button>
        <div>
          <h1 className="font-heading text-lg sm:text-xl font-bold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Production Ops Active
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs border border-primary/25">
            A
          </div>
          <div className="hidden sm:block text-left text-xs">
            <span className="font-semibold block leading-tight">Admin Console</span>
            <span className="text-[10px] text-muted-foreground">admin@veiledcanvas.com</span>
          </div>
        </div>
      </div>
    </header>
  );
}
