import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, ShoppingBag, TrendingUp, AlertCircle } from "lucide-react";

export default async function SellerDashboardPage() {
  const profile = await requireAuth(["seller"]);
  // requireAuth(["seller"]) only resolves for approved sellers with a row in
  // `sellers`, so seller_id is always set here; the type just can't express that.
  const sellerId = profile.seller_id as string;
  const supabase = await createClient();

  const [{ count: activeProductCount }, { count: openOrderCount }] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", sellerId)
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("sub_orders")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", sellerId)
      .not("status", "in", "(delivered,cancelled,returned)")
      .is("deleted_at", null),
  ]);

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
              Open Orders
            </CardTitle>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{openOrderCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Not yet delivered</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Active Products
            </CardTitle>
            <Package className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeProductCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Live in your catalog</p>
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
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground mt-1">Available once orders are live</p>
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
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground mt-1">Available once orders are live</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
