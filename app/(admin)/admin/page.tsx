import Link from "next/link";
import { requireAuth } from "@/lib/auth/roles";
import { getAdminDashboardStats } from "@/lib/services/admin-dashboard";
import { formatPaisa } from "@/lib/format/currency";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  ShoppingBag,
  Percent,
  Store,
  Clock,
  Banknote,
  ArrowUpRight,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const user = await requireAuth(["superadmin", "admin_staff"]);
  const t = await getTranslations("admin");
  const params = await searchParams;
  const days = params.days ? parseInt(params.days, 10) || 30 : 30;

  const stats = await getAdminDashboardStats(user.id, user.role, days);

  // Find max GMV for chart normalization
  const maxGmv = Math.max(...stats.chartData.map((d) => d.gmvMinor), 1);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header and date filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time platform metrics computed from the immutable financial ledger.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl self-start sm:self-auto border border-border">
          {[
            { label: t("days7"), value: "7" },
            { label: t("days30"), value: "30" },
            { label: t("days90"), value: "90" },
          ].map((period) => {
            const isSelected = String(days) === period.value;
            return (
              <Link
                key={period.value}
                href={`/admin?days=${period.value}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {period.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV */}
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              {t("gmv")}
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatPaisa(stats.gmvMinor)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Non-cancelled orders in last {days} days
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              {t("ordersCount")}
            </CardTitle>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.orderCount.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Completed & in-flight customer orders
            </p>
          </CardContent>
        </Card>

        {/* Commission */}
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              {t("commission")}
            </CardTitle>
            <Percent className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatPaisa(stats.commissionMinor)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Earned platform take in period
            </p>
          </CardContent>
        </Card>

        {/* Active Sellers */}
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              {t("activeSellers")}
            </CardTitle>
            <Store className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.activeSellersCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Approved merchants trading on platform
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Queues & COD Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Governance Queues */}
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                {t("pendingApprovals")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/admin/sellers"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors border border-border/60"
            >
              <div>
                <p className="text-xs font-semibold text-foreground">Seller Applications</p>
                <p className="text-[11px] text-muted-foreground">Merchants awaiting identity review</p>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent">
                {stats.pendingApprovals.sellers}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/admin/products"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors border border-border/60"
            >
              <div>
                <p className="text-xs font-semibold text-foreground">Products Moderation</p>
                <p className="text-[11px] text-muted-foreground">Catalog submissions in queue</p>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent">
                {stats.pendingApprovals.products}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/admin/bank-requests"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors border border-border/60"
            >
              <div>
                <p className="text-xs font-semibold text-foreground">Bank Detail Changes</p>
                <p className="text-[11px] text-muted-foreground">Payout IBAN modifications</p>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent">
                {stats.pendingApprovals.bankChanges}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </CardContent>
        </Card>

        {/* COD Reconciliation Status */}
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" />
              {t("codPending")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/80">
              <div className="text-2xl font-bold text-foreground">
                {formatPaisa(stats.codPending.amountMinor)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Outstanding cash collected across courier partners
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-foreground font-medium">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                {stats.codPending.count} remittances pending reconciliation
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              COD remittances must be matched against courier statements before merchant payout balances are credited.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simple Volume Trend Chart */}
      <Card className="rounded-2xl border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Daily Marketplace Activity Trend ({days} Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-44 flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-1">
            {stats.chartData.map((d, idx) => {
              const heightPercent = Math.max(
                Math.round((d.gmvMinor / maxGmv) * 100),
                d.gmvMinor > 0 ? 8 : 2
              );
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-20 font-mono shadow-md">
                    {d.date}: {formatPaisa(d.gmvMinor)} ({d.orderCount} orders)
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all ${
                      d.gmvMinor > 0
                        ? "bg-primary/80 group-hover:bg-primary"
                        : "bg-muted/40"
                    }`}
                  />
                  {idx % Math.ceil(days / 6) === 0 && (
                    <span className="text-[9px] text-muted-foreground mt-1 truncate max-w-full">
                      {d.date.slice(5)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
