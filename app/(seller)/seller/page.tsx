import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, ShoppingBag, AlertCircle, Banknote, Calendar } from "lucide-react";

interface SellerDashboardStats {
  sales_today: number;
  sales_7d: number;
  sales_30d: number;
  pending_orders: number;
  low_stock: number;
  available_balance: number;
  held_balance: number;
}

export default async function SellerDashboardPage() {
  const profile = await requireAuth(["seller"]);
  const t = await getTranslations("seller");
  const sellerId = profile.seller_id as string;
  const supabase = await createClient();

  const { data: statsData } = await supabase
    .rpc("get_seller_dashboard_stats", { p_seller_id: sellerId });

  const stats = (statsData as unknown as SellerDashboardStats) || {
    sales_today: 0,
    sales_7d: 0,
    sales_30d: 0,
    pending_orders: 0,
    low_stock: 0,
    available_balance: 0,
    held_balance: 0
  };

  const formatMoney = (minor: number) => `Rs. ${(minor / 100).toLocaleString()}`;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          {t("dashboardTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dashboardSubtitle")}
        </p>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Pending Orders
            </CardTitle>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.pending_orders}</div>
            <p className="text-xs text-muted-foreground mt-1">Require confirmation</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground text-destructive">
              Low Stock Alerts
            </CardTitle>
            <Package className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.low_stock}</div>
            <p className="text-xs text-destructive/80 mt-1">Variants below threshold</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Available Balance
            </CardTitle>
            <Banknote className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatMoney(stats.available_balance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for payout</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Held Balance
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatMoney(stats.held_balance)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending clearance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-muted-foreground">Today</span>
              <span className="font-bold">{formatMoney(stats.sales_today)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-muted-foreground">Last 7 Days</span>
              <span className="font-bold">{formatMoney(stats.sales_7d)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last 30 Days</span>
              <span className="font-bold">{formatMoney(stats.sales_30d)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
