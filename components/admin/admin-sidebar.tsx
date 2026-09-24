import Link from "next/link";
import { LayoutDashboard, Users, Store, ShieldAlert, FileText, Settings, Landmark } from "lucide-react";

export function AdminSidebar() {
  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Sellers & KYC", href: "/admin/sellers", icon: Store },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Financial Ledger", href: "/admin/ledger", icon: Landmark },
    { label: "Audit Logs", href: "/admin/audit", icon: ShieldAlert },
    { label: "Platform Policies", href: "/admin/policies", icon: FileText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <Icon className="w-4 h-4 text-accent" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-auto p-4 border-t border-border/80 text-[11px] text-muted-foreground">
        Audit logging active for all mutations
      </div>
    </aside>
  );
}
