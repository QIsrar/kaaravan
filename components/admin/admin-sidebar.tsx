"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  CheckCircle,
  FolderTree,
  ShoppingBag,
  Users,
  Truck,
  Sparkles,
  UserCheck,
  Settings,
  ShieldAlert,
} from "lucide-react";
import type { AdminPermission } from "@/lib/validators/admin";
import { useTranslations } from "next-intl";

interface AdminSidebarProps {
  permissions: AdminPermission[];
  isSuperadmin: boolean;
}

interface NavSection {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: AdminPermission;
  superadminOnly?: boolean;
}

export function AdminSidebar({ permissions, isSuperadmin }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("admin");

  const allSections: NavSection[] = [
    { labelKey: "dashboard", href: "/admin", icon: LayoutDashboard },
    {
      labelKey: "sellers",
      href: "/admin/sellers",
      icon: Store,
      permission: "manage_sellers",
    },
    {
      labelKey: "bankRequests",
      href: "/admin/bank-requests",
      icon: CreditCard,
      permission: "manage_finance",
    },
    {
      labelKey: "products",
      href: "/admin/products",
      icon: CheckCircle,
      permission: "manage_catalog",
    },
    {
      labelKey: "catalog",
      href: "/admin/catalog",
      icon: FolderTree,
      permission: "manage_catalog",
    },
    {
      labelKey: "orders",
      href: "/admin/orders",
      icon: ShoppingBag,
      permission: "manage_orders",
    },
    {
      labelKey: "customers",
      href: "/admin/customers",
      icon: Users,
      permission: "manage_users",
    },
    {
      labelKey: "couriers",
      href: "/admin/couriers",
      icon: Truck,
      permission: "manage_logistics",
    },
    {
      labelKey: "marketing",
      href: "/admin/marketing",
      icon: Sparkles,
      permission: "manage_promotions",
    },
    {
      labelKey: "staff",
      href: "/admin/staff",
      icon: UserCheck,
      superadminOnly: true,
    },
    {
      labelKey: "settings",
      href: "/admin/settings",
      icon: Settings,
      permission: "manage_settings",
    },
    {
      labelKey: "audit",
      href: "/admin/audit",
      icon: ShieldAlert,
    },
  ];

  // Filter sections according to permissions
  const visibleSections = allSections.filter((item) => {
    if (isSuperadmin) return true;
    if (item.superadminOnly) return false;
    if (!item.permission) return true;
    return permissions.includes(item.permission);
  });

  return (
    <aside className="w-64 border-e border-border bg-card flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-3 space-y-1">
        {visibleSections.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-primary-foreground" : "text-primary"
                }`}
              />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-border/80 text-[11px] text-muted-foreground">
        <p className="font-semibold text-foreground/80">Kaaravan Governance</p>
        <p className="mt-0.5 text-[10px]">Audit logged & security checked</p>
      </div>
    </aside>
  );
}
