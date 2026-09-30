import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getCustomerOrders } from "@/lib/services/customer_orders";
import { JourneyTracker } from "@/components/store/journey-tracker";
import { PatternDivider } from "@/components/store/pattern-divider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPaisa } from "@/lib/format/currency";
import {
  Package,
  ShoppingBag,
  Heart,
  MapPin,
  Settings,
  ArrowRight,
  Store,
} from "lucide-react";
import type { JourneyStop } from "@/lib/couriers/types";
import type { Database } from "@/lib/types/database";

type SubOrderStatus = Database["public"]["Enums"]["sub_order_status"];

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

export default async function AccountOverviewPage() {
  const profile = await requireAuth(["customer", "seller", "superadmin"]);
  const t = await getTranslations("account");
  const tOrders = await getTranslations("orders");
  const supabase = await createClient();

  // Fetch customer orders, wishlist counts, profile, and optional seller info
  const [orders, { count: wishlistCount }, { data: profileRow }, { data: sellerData }] = await Promise.all([
    getCustomerOrders(supabase, profile.id),
    supabase
      .from("wishlists")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profile.id),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", profile.id)
      .single(),
    profile.role === "seller"
      ? supabase
          .from("sellers")
          .select("business_name")
          .eq("owner_profile_id", profile.id)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Identify active sub-orders for journey tracking (non-terminal: pending, confirmed, packed, shipped)
  const activeSubOrders: {
    orderNumber: string;
    subOrderId: string;
    sellerName: string;
    status: SubOrderStatus;
    stage: JourneyStop;
  }[] = [];

  for (const order of orders || []) {
    for (const sub of order.sub_orders || []) {
      if (
        [
          "awaiting_confirmation",
          "pending",
          "confirmed",
          "packed",
          "ready_to_ship",
          "shipped",
        ].includes(sub.status)
      ) {
        activeSubOrders.push({
          orderNumber: order.order_number,
          subOrderId: sub.id,
          sellerName: sub.sellers?.business_name || "Artisan Workshop",
          status: sub.status as SubOrderStatus,
          stage: STATUS_STAGE[sub.status as SubOrderStatus] || "placed",
        });
      }
    }
  }

  const latestOrders = (orders || []).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
            {profileRow?.full_name
              ? t("welcomeName", { name: profileRow.full_name })
              : t("welcomeBack", { email: profile.email || "" })}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {profile.email}
            {profile.role !== "seller" && (
              <>
                {" "}&bull;{" "}
                <span className="capitalize font-medium text-primary">
                  {profile.role}
                </span>
              </>
            )}
          </p>
        </div>
        <Link href="/account/orders">
          <Button variant="outline" size="sm" className="rounded-xl border-border gap-1.5 text-xs">
            <span>{t("viewAllOrders")}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Button>
        </Link>
      </div>

      {/* Seller Banner */}
      {profile.role === "seller" && (
        <div className="p-4 sm:p-5 rounded-3xl border border-secondary/40 bg-secondary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-foreground">
                {t("sellerBanner", {
                  name: sellerData?.business_name || "Artisan Workshop",
                })}
              </h3>
            </div>
          </div>
          <Link href="/seller">
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs font-semibold h-9 px-4 shrink-0"
            >
              {t("goToSellerPortal")}
            </Button>
          </Link>
        </div>
      )}

      {/* Active Order Journey Tracker per Sub-Order */}
      {activeSubOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <span>{t("activeJourney")}</span>
            </h2>
            <Badge variant="outline" className="border-secondary text-primary font-semibold text-xs">
              {activeSubOrders.length} {tOrders("status.shipped")}
            </Badge>
          </div>

          <div className="space-y-4">
            {activeSubOrders.slice(0, 2).map((item) => (
              <div key={item.subOrderId} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground ps-2">
                  <Store className="w-3.5 h-3.5 text-primary" />
                  <span>{tOrders("packageFrom", { seller: item.sellerName })}</span>
                </div>
                <JourneyTracker
                  currentStop={item.stage}
                  orderNumber={item.orderNumber}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links Grid */}
      <div className="space-y-3">
        <h2 className="font-heading text-base font-bold text-foreground">
          {t("quickLinks")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/account/orders"
            className="p-4 rounded-2xl border border-border bg-card shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">{t("orders")}</span>
              <span className="font-heading font-bold text-base text-foreground">
                {orders?.length || 0}
              </span>
            </div>
          </Link>

          <Link
            href="/account/wishlist"
            className="p-4 rounded-2xl border border-border bg-card shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">{t("wishlist")}</span>
              <span className="font-heading font-bold text-base text-foreground">
                {wishlistCount || 0}
              </span>
            </div>
          </Link>

          <Link
            href="/account/addresses"
            className="p-4 rounded-2xl border border-border bg-card shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">{t("addresses")}</span>
              <span className="font-heading font-bold text-sm text-foreground">
                {t("addresses")}
              </span>
            </div>
          </Link>

          <Link
            href="/account/settings"
            className="p-4 rounded-2xl border border-border bg-card shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">{t("settings")}</span>
              <span className="font-heading font-bold text-sm text-foreground">
                {t("profileSecurity")}
              </span>
            </div>
          </Link>
        </div>
      </div>

      <PatternDivider variant="tilework" className="py-2" />

      {/* Recent Orders List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span>{t("orderHistory")}</span>
          </h2>
          {orders && orders.length > 0 && (
            <Link
              href="/account/orders"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>{t("viewAllOrders")}</span>
              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </Link>
          )}
        </div>

        {!orders || orders.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-3xl border border-dashed border-border bg-card/60 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-heading font-bold text-base text-foreground">
                {t("emptyOrdersTitle")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("emptyOrdersDesc")}
              </p>
            </div>
            <Link href="/" className="inline-block pt-2">
              <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold">
                {t("startShopping")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {latestOrders.map((order) => {
              const subCount = order.sub_orders?.length || 1;
              return (
                <Card
                  key={order.id}
                  className="rounded-2xl border-border bg-card hover:border-primary/30 transition-all overflow-hidden"
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-foreground">
                          #{order.order_number}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0">
                          {tOrders("packagesCount", { count: subCount })}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tOrders("placedOn", {
                          date: new Date(order.placed_at).toLocaleDateString("en-PK", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }),
                        })}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {order.sub_orders?.map((sub) => (
                          <span
                            key={sub.id}
                            className="inline-flex items-center text-[10px] font-medium bg-muted px-2 py-0.5 rounded-md text-foreground"
                          >
                            <span className="truncate max-w-[120px]">
                              {sub.sellers?.business_name || "Artisan"}:
                            </span>
                            <span className="ms-1 font-semibold text-primary">
                              {tOrders(`status.${sub.status}` as Parameters<typeof tOrders>[0]) || sub.status}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                      <div className="text-start sm:text-end">
                        <span className="text-[11px] text-muted-foreground block">
                          {tOrders("total")}
                        </span>
                        <span className="font-heading font-extrabold text-base text-foreground">
                          {formatPaisa(Number(order.total_minor))}
                        </span>
                      </div>
                      <Link href={`/account/orders/${order.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-border text-xs font-semibold gap-1 h-8 px-3"
                        >
                          <span>{tOrders("viewOrder")}</span>
                          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
