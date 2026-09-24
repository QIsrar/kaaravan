import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, ShoppingBag, TrendingUp, AlertCircle } from "lucide-react";

export default function SellerDashboardPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          Seller Portal Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor your store catalog, customer journey orders, and settlements.
        </p>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Active Orders
            </CardTitle>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">In caravan transit</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">84</div>
            <p className="text-xs text-muted-foreground mt-1">Active inventory</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Net Sales
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">PKR 142,500</div>
            <p className="text-xs text-muted-foreground mt-1">Paisa-exact minor units</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Pending Payout
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">PKR 38,200</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled for cycle</p>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm text-primary">
        <p className="font-medium">Phase 1 Foundation Active</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Row Level Security (RLS) is strictly configured on Postgres. All mutations create immutable audit logs.
        </p>
      </div>
    </div>
  );
}
