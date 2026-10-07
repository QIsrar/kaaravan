import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getCustomerOrders } from "@/lib/services/customer_orders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Image } from "@/components/ui/image";
import { formatPaisa } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import {
  ShoppingBag,
  Store,
  ArrowRight,
  Calendar,
  CreditCard,
} from "lucide-react";
import type { Database } from "@/lib/types/database";

type SubOrderStatus = Database["public"]["Enums"]["sub_order_status"];

function getStatusBadgeVariant(status: SubOrderStatus): "default" | "secondary" | "accent" | "outline" | "destructive" {
  switch (status) {
    case "delivered":
      return "default";
    case "shipped":
      return "secondary";
    case "pending":
    case "awaiting_confirmation":
    case "confirmed":
    case "packed":
    case "ready_to_ship":
      return "accent";
    case "cancelled":
    case "returned":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function CustomerOrdersPage() {
  const profile = await requireAuth(["customer", "seller", "superadmin"]);
  const tOrders = await getTranslations("orders");
  const supabase = await createClient();

  const orders = await getCustomerOrders(supabase, profile.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          {tOrders("title")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {tOrders("subtitle")}
        </p>
      </div>

      {/* Orders List */}
      {!orders || orders.length === 0 ? (
        <div className="p-10 sm:p-16 text-center rounded-3xl border border-dashed border-border bg-card/60 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-heading font-bold text-base text-foreground">
              {tOrders("emptyTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {tOrders("emptyDesc")}
            </p>
          </div>
          <Link href="/" className="inline-block pt-2">
            <Button className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold">
              {tOrders("exploreBazaar")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const placedDate = formatDate(order.placed_at);
            const subOrders = order.sub_orders || [];

            return (
              <Card
                key={order.id}
                className="rounded-3xl border-border bg-card shadow-2xs hover:border-primary/30 transition-all overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Top Order Meta Bar */}
                  <div className="p-4 sm:p-5 bg-muted/30 border-b border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          {tOrders("orderNumberLabel")}
                        </span>
                        <span className="font-mono font-bold text-foreground text-sm">
                          #{order.order_number}
                        </span>
                      </div>
                      <div className="hidden sm:block w-px h-6 bg-border" />
                      <div>
                        <span className="text-muted-foreground block text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>{tOrders("datePlaced")}</span>
                        </span>
                        <span className="font-medium text-foreground">
                          {placedDate}
                        </span>
                      </div>
                      <div className="hidden sm:block w-px h-6 bg-border" />
                      <div>
                        <span className="text-muted-foreground block text-[11px] flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-muted-foreground" />
                          <span>{tOrders("paymentLabel")}</span>
                        </span>
                        <span className="font-medium uppercase text-[11px] text-foreground">
                          {order.payment_method} &bull; {tOrders(`payment.${order.payment_status}` as Parameters<typeof tOrders>[0]) || order.payment_status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-end">
                        <span className="text-muted-foreground block text-[11px]">
                          {tOrders("total")}
                        </span>
                        <span className="font-heading font-extrabold text-base text-foreground">
                          {formatPaisa(Number(order.total_minor))}
                        </span>
                      </div>
                      <Link href={`/account/orders/${order.id}`}>
                        <Button
                          size="sm"
                          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-9 px-3.5 gap-1.5"
                        >
                          <span>{tOrders("viewOrder")}</span>
                          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Sub-Orders (Artisan Packages) */}
                  <div className="p-4 sm:p-5 divide-y divide-border/60">
                    {subOrders.map((sub) => {
                      const sellerName = sub.sellers?.business_name || "Artisan Workshop";
                      const items = sub.order_items || [];
                      const statusVariant = getStatusBadgeVariant(sub.status as SubOrderStatus);

                      return (
                        <div
                          key={sub.id}
                          className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-3 flex-1">
                            {/* Seller & Sub-Order Status */}
                            <div className="flex items-center gap-2.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                <Store className="w-4 h-4 text-primary" />
                                <span><bdi dir="auto">{sellerName}</bdi></span>
                              </div>
                              <Badge
                                variant={statusVariant}
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
                              >
                                {tOrders(`status.${sub.status}` as Parameters<typeof tOrders>[0]) || sub.status}
                              </Badge>
                            </div>

                            {/* Item previews */}
                            <div className="flex flex-wrap items-center gap-2">
                              {items.map((item) => {
                                const imagePath =
                                  item.product_variants?.products?.product_images?.[0]?.path ||
                                  "/placeholder-product.svg";
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 p-1.5 pe-3 rounded-xl border border-border/80 bg-muted/20 text-xs"
                                  >
                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                                      <Image
                                        src={imagePath}
                                        alt={item.product_title}
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                      />
                                    </div>
                                    <span className="font-medium text-foreground line-clamp-1 max-w-[160px] sm:max-w-[200px]">
                                      <bdi dir="auto">{item.product_title}</bdi>
                                    </span>
                                    <span className="text-muted-foreground text-[11px]">
                                      &times;{item.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="text-end shrink-0 hidden sm:block">
                            <span className="text-xs text-muted-foreground block">
                              {tOrders("packageSubtotal")}
                            </span>
                            <span className="font-mono font-semibold text-sm text-foreground">
                              {formatPaisa(Number(sub.total_minor))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
