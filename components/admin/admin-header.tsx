import Link from "next/link";
import { BRAND_CONFIG } from "@/config/brand";
import { ShieldCheck, UserCog } from "lucide-react";

export function AdminHeader() {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-heading font-bold text-lg text-primary">
          {BRAND_CONFIG.name}
        </Link>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/15 text-accent font-semibold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Superadmin Panel
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            <UserCog className="w-4 h-4" />
          </div>
          <span className="font-medium hidden sm:inline">Platform Owner</span>
        </div>
      </div>
    </header>
  );
}
