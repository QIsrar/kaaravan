"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Compass,
  Search,
  Store,
  AlertCircle,
  Loader2,
  Clock,
  Package,
} from "lucide-react";
import { lookupGuestOrderAction } from "@/lib/actions/customer_orders";
import { JourneyTracker } from "@/components/store/journey-tracker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { JourneyStop } from "@/lib/couriers/types";
import type { Database } from "@/lib/types/database";
import type { PublicTrackOrder } from "@/lib/services/customer_orders";

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

export function TrackOrderView() {
  const t = useTranslations("trackOrder");
  const tOrders = useTranslations("orders");

  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<PublicTrackOrder | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = orderNumber.trim();
    const cleanEmail = email.trim();

    if (!cleanNumber || !cleanEmail) {
      setErrorMessage(t("enterOrderAndEmail"));
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setOrderData(null);

    try {
      const data = await lookupGuestOrderAction(cleanNumber, cleanEmail);
      if (!data) {
        setErrorMessage(t("orderNotFound"));
      } else {
        setOrderData(data);
      }
    } catch {
      // Always show generic order not found message to avoid disclosing order existence
      setErrorMessage(t("orderNotFound"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title & Intro */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mx-auto mb-2 shadow-xs">
          <Compass className="w-6 h-6 stroke-[2]" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* Lookup Form Card */}
      <Card className="rounded-3xl border-border bg-card shadow-2xs">
        <CardContent className="p-6">
          <form onSubmit={handleTrack} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="order-number"
                  className="text-xs font-semibold text-foreground block"
                >
                  {t("orderNumber")} *
                </label>
                <input
                  id="order-number"
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder={t("orderNumberPlaceholder")}
                  className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="contact-email"
                  className="text-xs font-semibold text-foreground block"
                >
                  {t("email")} *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-10 px-6 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("tracking")}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{t("trackButton")}</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Order Results */}
      {orderData && (
        <div className="space-y-6 pt-2">
          {/* Order Banner */}
          <div className="p-4 sm:p-6 rounded-3xl border border-border bg-card shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                {t("guestNotice")}
              </span>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                {t("orderFoundTitle", { number: orderData.order_number })}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("placedOn", {
                  date: new Date(orderData.placed_at).toLocaleDateString("en-PK", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                })}
              </p>
            </div>
          </div>

          {/* Sub-Orders Journey Trackers */}
          <div className="space-y-6">
            {orderData.sub_orders?.map((sub, idx) => {
              const sellerName = sub.seller_business_name || "Artisan Workshop";
              const subStatus = sub.status as SubOrderStatus;
              const stage = STATUS_STAGE[subStatus] || "placed";

              return (
                <Card
                  key={idx}
                  className="rounded-3xl border-border bg-card shadow-2xs overflow-hidden"
                >
                  <CardHeader className="bg-muted/30 border-b border-border/70 p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Store className="w-4 h-4 text-primary" />
                        <span>{sellerName}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-bold py-0"
                      >
                        {tOrders(
                          `status.${subStatus}` as Parameters<typeof tOrders>[0]
                        ) || subStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-6">
                    <JourneyTracker
                      currentStop={stage}
                      orderNumber={orderData.order_number}
                    />

                    {/* Items List (Titles & Quantities ONLY) */}
                    <div className="pt-2">
                      <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        {t("packageItems")}
                      </h4>
                      <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-background/50 overflow-hidden">
                        {sub.items?.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="p-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                              <p className="font-semibold text-foreground">
                                {item.product_title}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground shrink-0">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Status History Milestones */}
                    {sub.order_status_history &&
                      sub.order_status_history.length > 0 && (
                        <div className="pt-2 border-t border-border/60 space-y-2">
                          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>{t("packageMilestones")}</span>
                          </h4>
                          <div className="space-y-2 ps-2 border-s-2 border-primary/20 ms-1">
                            {sub.order_status_history.map((h, hIdx) => (
                              <div
                                key={hIdx}
                                className="relative ps-3 text-xs space-y-0.5"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground capitalize">
                                    {tOrders(
                                      `status.${h.to_status}` as Parameters<
                                        typeof tOrders
                                      >[0]
                                    ) || h.to_status}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(h.created_at).toLocaleDateString(
                                      "en-PK",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </span>
                                </div>
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
        </div>
      )}
    </div>
  );
}
