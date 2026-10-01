import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getCustomerOrderDetails } from "@/lib/services/customer_orders";
import { JourneyTracker } from "@/components/store/journey-tracker";
import { CancelSubOrderDialog } from "@/components/store/cancel-order-dialog";
import { ReturnItemDialog } from "@/components/store/return-item-dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image } from "@/components/ui/image";
import { formatPaisa } from "@/lib/format/currency";
import {
  Package,
  Store,
  ArrowLeft,
  CreditCard,
  MapPin,
  Clock,
} from "lucide-react";
import type { JourneyStop } from "@/lib/couriers/types";
import type { Database } from "@/lib/types/database";

type SubOrderStatus = Database["public"]["Enums"]["sub_order_status"];

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

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

function getOverallOrderStatus(subOrders: Array<{ status: string }>) {
  if (subOrders.length === 0) {
    return { key: "pending", labelKey: "status.pending", variant: "accent" as const };
  }
  const statuses = subOrders.map((s) => s.status);

  if (statuses.every((s) => s === "cancelled")) {
    return { key: "cancelled", labelKey: "status.cancelled", variant: "destructive" as const };
  }
  if (statuses.every((s) => s === "delivered")) {
    return { key: "delivered", labelKey: "status.delivered", variant: "default" as const };
  }
  if (statuses.every((s) => s === "returned")) {
    return { key: "returned", labelKey: "status.returned", variant: "destructive" as const };
  }

  const firstStatus = statuses[0];
  if (statuses.every((s) => s === firstStatus)) {
    return {
      key: firstStatus,
      labelKey: `status.${firstStatus}`,
      variant: getStatusBadgeVariant(firstStatus as SubOrderStatus),
    };
  }

  return { key: "in_progress", labelKey: "inProgress", variant: "secondary" as const };
}

export default async function CustomerOrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const profile = await requireAuth(["customer", "seller", "superadmin"]);
  const tOrders = await getTranslations("orders");
  const supabase = await createClient();

  let order = null;
  try {
    order = await getCustomerOrderDetails(supabase, profile.id, id);
  } catch {
    notFound();
  }

  if (!order) {
    notFound();
  }

  const placedDate = new Date(order.placed_at).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const shippingAddr = (order.shipping_address as Record<string, string>) || {};
  const subOrders = order.sub_orders || [];
  const overallStatus = getOverallOrderStatus(subOrders);

  return (
    <div className="space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{tOrders("backToOrders")}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              {tOrders("orderNumber", { number: order.order_number })}
            </h1>
            <Badge variant={overallStatus.variant} className="text-xs font-bold uppercase tracking-wider">
              {tOrders(overallStatus.labelKey as Parameters<typeof tOrders>[0]) || overallStatus.key}
            </Badge>
            <Badge variant="outline" className="text-xs font-medium border-border">
              {tOrders("paymentStatusLabel", {
                status: tOrders(`payment.${order.payment_status}` as Parameters<typeof tOrders>[0]) || order.payment_status,
              })}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {tOrders("placedOn", { date: placedDate })}
          </p>
        </div>

        <div className="text-start sm:text-end bg-card p-3 rounded-2xl border border-border">
          <span className="text-xs text-muted-foreground block">
            {tOrders("total")}
          </span>
          <span className="font-heading font-extrabold text-xl text-primary">
            {formatPaisa(Number(order.total_minor))}
          </span>
        </div>
      </div>

      {/* Artisan Merchant Packages (Sub-Orders) */}
      <div className="space-y-6">
        <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <span>{tOrders("packagesCount", { count: subOrders.length })}</span>
        </h2>

        {subOrders.map((sub) => {
          const seller = sub.sellers;
          const sellerName = seller?.business_name || "Artisan Workshop";
          const subStatus = sub.status as SubOrderStatus;
          const stage = STATUS_STAGE[subStatus] || "placed";
          const canCancel = ["awaiting_confirmation", "pending"].includes(subStatus);
          const isDelivered = subStatus === "delivered";
          const returnWindowDays = seller?.return_window_days || 7;

          // Delivery timestamp from status history
          const history = sub.order_status_history || [];
          const deliveredRecord = history.find((h) => h.to_status === "delivered");
          const deliveredDate = deliveredRecord?.created_at || (isDelivered ? sub.updated_at : null);

          const returns = sub.returns || [];
          const items = sub.order_items || [];

          return (
            <Card
              key={sub.id}
              className="rounded-3xl border-border bg-card shadow-2xs overflow-hidden"
            >
              <CardHeader className="bg-muted/30 border-b border-border/70 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {seller?.logo ? (
                        <Image
                          src={seller.logo}
                          alt={sellerName}
                          width={40}
                          height={40}
                          className="object-cover rounded-xl"
                        />
                      ) : (
                        <Store className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span><bdi dir="auto">{sellerName}</bdi></span>
                        <Badge
                          variant={getStatusBadgeVariant(subStatus)}
                          className="text-[10px] uppercase font-bold tracking-wider py-0"
                        >
                          {tOrders(`status.${subStatus}` as Parameters<typeof tOrders>[0]) || subStatus}
                        </Badge>
                      </CardTitle>
                      <span className="text-[11px] text-muted-foreground">
                        {tOrders("itemsCount", { count: items.length })} &bull; {tOrders("packageTotal")}{" "}
                        <strong className="text-foreground font-mono">
                          {formatPaisa(Number(sub.total_minor))}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Cancel Action if pending */}
                  {canCancel && (
                    <CancelSubOrderDialog
                      subOrderId={sub.id}
                      sellerName={sellerName}
                    />
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Journey Tracker for this Sub-Order */}
                <div className="space-y-2">
                  <JourneyTracker
                    currentStop={stage}
                    status={subStatus}
                    orderNumber={order.order_number}
                  />
                </div>

                {/* Sub-Order Items Table */}
                <div className="space-y-3">
                  <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {tOrders("orderItems")}
                  </h4>
                  <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-background/50 overflow-hidden">
                    {items.map((item) => {
                      const imagePath =
                        item.product_variants?.products?.product_images?.[0]?.path ||
                        "/placeholder-product.svg";
                      const productSlug = item.product_variants?.products?.slug;
                      const existingReturn = returns.find(
                        (r) => r.order_item_id === item.id
                      );

                      return (
                        <div
                          key={item.id}
                          className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                              <Image
                                src={imagePath}
                                alt={item.product_title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              {productSlug ? (
                                <Link
                                  href={`/product/${productSlug}`}
                                  className="font-heading font-semibold text-foreground hover:text-primary transition-colors block truncate"
                                >
                                  <bdi dir="auto">{item.product_title}</bdi>
                                </Link>
                              ) : (
                                <span className="font-heading font-semibold text-foreground block truncate">
                                  <bdi dir="auto">{item.product_title}</bdi>
                                </span>
                              )}
                              {item.variant_attributes && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                  <bdi dir="auto">
                                    {Object.entries(
                                      item.variant_attributes as Record<string, string>
                                    )
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(", ")}
                                  </bdi>
                                </p>
                              )}
                              <span className="text-[11px] text-muted-foreground">
                                {formatPaisa(Number(item.unit_price_minor))} &times; {item.quantity}
                              </span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                            <span className="font-mono font-bold text-sm text-foreground">
                              {formatPaisa(Number(item.line_total_minor))}
                            </span>

                            {/* Return Request Button / Status (Delivered Only) */}
                            {isDelivered && (
                              <ReturnItemDialog
                                subOrderId={sub.id}
                                orderItemId={item.id}
                                productTitle={item.product_title}
                                sellerName={sellerName}
                                itemQuantity={item.quantity}
                                returnWindowDays={returnWindowDays}
                                deliveredDate={deliveredDate}
                                existingReturn={existingReturn}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-Order Journey History / Milestones */}
                {history.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{tOrders("orderTimeline")}</span>
                    </h4>
                    <div className="space-y-2 ps-2 border-s-2 border-primary/20 ms-1">
                      {history.map((h) => (
                        <div key={h.id} className="relative ps-3 text-xs space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground capitalize">
                              {tOrders(`status.${h.to_status}` as Parameters<typeof tOrders>[0]) || h.to_status}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(h.created_at).toLocaleDateString("en-PK", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {h.note && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {h.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delivery Destination & Order Summary Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <Card className="rounded-3xl border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{tOrders("shippingAddress")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground" dir="auto">
            <p className="font-bold text-foreground text-sm">
              <bdi dir="auto">{shippingAddr.full_name || shippingAddr.fullName || "Customer"}</bdi>
            </p>
            <p dir="ltr" className="text-start"><bdi dir="ltr">{shippingAddr.phone}</bdi></p>
            <p className="pt-1"><bdi dir="auto">{shippingAddr.street}</bdi></p>
            <p>
              <bdi dir="auto">{shippingAddr.area}</bdi>, <bdi dir="auto">{shippingAddr.city}</bdi>
            </p>
            <p>
              <bdi dir="auto">{shippingAddr.province}</bdi> {shippingAddr.postalCode && `(${shippingAddr.postalCode})`}
            </p>
          </CardContent>
        </Card>

        {/* Order Payment & Financial Summary */}
        <Card className="rounded-3xl border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>{tOrders("paymentDetails")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">{tOrders("paymentMethod")}:</span>
              <span className="font-semibold uppercase text-foreground">
                {order.payment_method}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">{tOrders("subtotal")}:</span>
              <span className="font-mono text-foreground">
                {formatPaisa(Number(order.subtotal_minor))}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">{tOrders("shipping")}:</span>
              <span className="font-mono text-foreground">
                {formatPaisa(Number(order.shipping_minor))}
              </span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-bold">
              <span className="text-foreground">{tOrders("total")}:</span>
              <span className="font-mono text-primary text-base">
                {formatPaisa(Number(order.total_minor))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
