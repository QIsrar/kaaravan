import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { JourneyTracker } from "@/components/store/journey-tracker";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPaisa } from "@/lib/format/currency";
import { User, Package, ShoppingBag } from "lucide-react";
import type { JourneyStop } from "@/lib/couriers/types";
import type { Database } from "@/lib/types/database";

type SubOrderStatus = Database["public"]["Enums"]["sub_order_status"];

const TERMINAL_STATUSES: SubOrderStatus[] = ["delivered", "cancelled", "returned"];

const STATUS_STAGE: Record<SubOrderStatus, JourneyStop> = {
  awaiting_confirmation: "placed",
  pending: "placed",
  confirmed: "placed",
  packed: "packed",
  ready_to_ship: "packed",
  shipped: "on_the_way",
  delivered: "arrived",
  cancelled: "placed",
  returned: "placed",
};

const STAGE_RANK: Record<JourneyStop, number> = {
  placed: 0,
  packed: 1,
  on_the_way: 2,
  arrived: 3,
};

interface OrderRow {
  id: string;
  order_number: string;
  placed_at: string;
  total_minor: number | string;
  currency: string;
  sub_orders: { id: string; status: SubOrderStatus }[] | null;
}

function activeStageOf(subOrders: { status: SubOrderStatus }[]): JourneyStop | null {
  const active = subOrders.filter((s) => !TERMINAL_STATUSES.includes(s.status) || s.status === "delivered");
  const inProgress = subOrders.filter((s) => !TERMINAL_STATUSES.includes(s.status));
  if (inProgress.length === 0) {
    // All sub-orders are terminal: fully delivered counts as "arrived", cancelled/returned has no active stage.
    return active.length > 0 && active.every((s) => s.status === "delivered") ? "arrived" : null;
  }
  const ranks = inProgress.map((s) => STAGE_RANK[STATUS_STAGE[s.status]]);
  const minRank = Math.min(...ranks);
  return (Object.keys(STAGE_RANK) as JourneyStop[]).find((k) => STAGE_RANK[k] === minRank) ?? "placed";
}

function describeOrderStatus(subOrders: { status: SubOrderStatus }[]): string {
  if (subOrders.length === 0) return "Processing";
  if (subOrders.every((s) => s.status === "delivered")) return "Delivered";
  if (subOrders.every((s) => s.status === "cancelled")) return "Cancelled";
  const stage = activeStageOf(subOrders);
  switch (stage) {
    case "on_the_way":
      return "On the way";
    case "packed":
      return "Packed";
    case "arrived":
      return "Delivered";
    default:
      return "Placed";
  }
}

export default async function AccountPage() {
  const profile = await requireAuth(["customer", "seller", "superadmin"]);
  const tAccount = await getTranslations("account");
  const supabase = await createClient();

  const { data: rawOrders } = await supabase
    .from("orders")
    .select("id, order_number, placed_at, total_minor, currency, sub_orders(id, status)")
    .eq("profile_id", profile.id)
    .is("deleted_at", null)
    .order("placed_at", { ascending: false })
    .limit(10);

  const orders = (rawOrders as unknown as OrderRow[]) || [];

  const activeOrder = orders.find((o) => {
    const subs = o.sub_orders || [];
    return subs.length > 0 && subs.some((s) => !TERMINAL_STATUSES.includes(s.status));
  });
  const activeStage = activeOrder ? activeStageOf(activeOrder.sub_orders || []) : null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          {tAccount("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tAccount("welcomeBack", { email: profile.email ?? "" })}
        </p>
      </div>

      {/* Active Order Journey Tracker */}
      {activeOrder && activeStage && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <span>Active Journey</span>
          </h2>
          <JourneyTracker currentStop={activeStage} orderNumber={activeOrder.order_number} />
        </div>
      )}

      {/* Order History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <span>Order History</span>
        </h2>

        {orders.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card space-y-4">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t placed any orders yet.
            </p>
            <Link href="/">
              <Button className="rounded-xl bg-primary text-primary-foreground">
                Start shopping
              </Button>
            </Link>
          </div>
        ) : (
          <Card className="rounded-2xl border-border">
            <CardContent className="divide-y divide-border/60">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <span className="font-mono font-semibold text-foreground block">
                      #{order.order_number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.placed_at).toLocaleDateString("en-PK", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="font-mono font-semibold text-foreground block">
                      {formatPaisa(Number(order.total_minor))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {describeOrderStatus(order.sub_orders || [])}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Account Details Card */}
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span>Profile & Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-border/60">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium text-foreground">{profile.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/60">
            <span className="text-muted-foreground">Assigned Role:</span>
            <span className="font-medium uppercase text-primary text-xs bg-primary/10 px-2 py-0.5 rounded-full">
              {profile.role}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Default Currency:</span>
            <span className="font-medium text-foreground">PKR (Pakistani Rupee)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
