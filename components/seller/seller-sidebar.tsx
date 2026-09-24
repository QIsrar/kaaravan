import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Settings, DollarSign } from "lucide-react";

export function SellerSidebar() {
  const navItems = [
    { label: "Dashboard", href: "/seller", icon: LayoutDashboard },
    { label: "Orders (Journey)", href: "/seller/orders", icon: ShoppingCart },
    { label: "Catalog & Stock", href: "/seller/products", icon: Package },
    { label: "Finances & Payouts", href: "/seller/finances", icon: DollarSign },
    { label: "Settings", href: "/seller/settings", icon: Settings },
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
              <Icon className="w-4 h-4 text-primary" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-auto p-4 border-t border-border/80 text-[11px] text-muted-foreground">
        RLS enforced: Seller partition only
      </div>
    </aside>
  );
}
