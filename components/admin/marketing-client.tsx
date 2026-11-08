"use client";

import React, { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { formatPaisa } from "@/lib/format/currency";
import {
  createCouponAction,
  toggleCouponActiveAction,
} from "@/lib/actions/admin";
import type { AdminCouponListItem } from "@/lib/services/admin-marketing";
import type { AdminBannerListItem } from "@/lib/services/admin-content";
import {
  Ticket,
  Image as ImageIcon,
  Plus,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface MarketingClientProps {
  initialCoupons: AdminCouponListItem[];
  initialBanners: AdminBannerListItem[];
}

export function MarketingClient({
  initialCoupons,
  initialBanners,
}: MarketingClientProps) {
  const t = useTranslations("admin");
  const [activeTab, setActiveTab] = useState<"coupons" | "banners">("coupons");

  const [coupons, setCoupons] = useState<AdminCouponListItem[]>(initialCoupons);
  const [banners] = useState<AdminBannerListItem[]>(initialBanners);

  // Coupon modal state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [usageLimit, setUsageLimit] = useState("");

  const [isPending, startTransition] = useTransition();

  const couponColumns: ColumnDef<AdminCouponListItem>[] = [
    {
      header: "Code",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
          {row.code}
        </span>
      ),
    },
    {
      header: "Discount",
      cell: (row) => {
        if (row.discount_type === "percent") {
          return (
            <span className="font-mono text-xs">
              {((row.percent_bps || 0) / 100).toFixed(0)}% OFF
            </span>
          );
        }
        return (
          <span className="font-mono text-xs">
            {formatPaisa(row.fixed_minor || 0)} OFF
          </span>
        );
      },
    },
    {
      header: "Min Order",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.min_order_minor ? formatPaisa(row.min_order_minor) : "No minimum"}
        </span>
      ),
    },
    {
      header: "Redemptions",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.used_count} / {row.usage_limit || "∞"}
        </span>
      ),
    },
    {
      header: t("status"),
      cell: (row) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${
            row.is_active
              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: t("actions"),
      className: "text-end",
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            startTransition(async () => {
              await toggleCouponActiveAction(row.id, !row.is_active);
              setCoupons((prev) =>
                prev.map((c) =>
                  c.id === row.id ? { ...c, is_active: !row.is_active } : c
                )
              );
            });
          }}
          disabled={isPending}
          className="h-8 px-2.5 text-xs font-semibold"
        >
          {row.is_active ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  const bannerColumns: ColumnDef<AdminBannerListItem>[] = [
    {
      header: "Banner Preview",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative w-20 h-10 rounded-xl overflow-hidden bg-muted/60 shrink-0 border border-border">
            <Image
              src={row.image_url || "/images/placeholder.webp"}
              alt={row.title_en || row.title || "Banner"}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs">
              {row.title_en || row.title}
            </p>
            <p className="text-[11px] text-muted-foreground font-urdu" dir="rtl">
              {row.title_ur || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Tag (EN / UR)",
      cell: (row) => (
        <div className="text-[11px]">
          <span className="font-semibold text-primary">{row.tag_en || "—"}</span>
          <p className="text-muted-foreground font-urdu" dir="rtl">{row.tag_ur || "—"}</p>
        </div>
      ),
    },
    {
      header: "Sort Order",
      accessorKey: "sort_order",
      cell: (row) => <span className="font-mono text-xs">{row.sort_order}</span>,
    },
    {
      header: t("status"),
      cell: (row) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${
            row.is_active
              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {row.is_active ? "Live" : "Hidden"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
          {[
            { label: "Promotional Coupons", value: "coupons", icon: Ticket },
            { label: "Localized Banners", value: "banners", icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value as "coupons" | "banners")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "coupons" && (
          <Button
            size="sm"
            onClick={() => setIsCouponModalOpen(true)}
            className="text-xs h-9 font-semibold"
          >
            <Plus className="w-4 h-4 me-1.5" />
            Create Coupon
          </Button>
        )}
      </div>

      {activeTab === "coupons" && (
        <Card className="rounded-2xl border-border bg-card">
          <CardContent className="p-4 sm:p-6">
            <DataTable
              columns={couponColumns}
              data={coupons}
              searchPlaceholder="Search coupons by code..."
              searchFilter={(item, query) =>
                item.code.toLowerCase().includes(query)
              }
            />
          </CardContent>
        </Card>
      )}

      {activeTab === "banners" && (
        <Card className="rounded-2xl border-border bg-card">
          <CardContent className="p-4 sm:p-6">
            <DataTable
              columns={bannerColumns}
              data={banners}
              searchPlaceholder="Search banners..."
              searchFilter={(item, query) =>
                (item.title_en?.toLowerCase().includes(query) ?? false) ||
                (item.tag_en?.toLowerCase().includes(query) ?? false)
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Create Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-lg font-bold text-foreground">
                Create Promotional Coupon
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCouponModalOpen(false)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="coupon-code">Coupon Code</Label>
                <Input
                  id="coupon-code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. KAARAVAN10"
                  className="h-8 text-xs font-mono uppercase mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="disc-type">Discount Type</Label>
                  <select
                    id="disc-type"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-card text-foreground mt-1"
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed (Paisa)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="disc-val">
                    {discountType === "percent" ? "Percent (bps, e.g. 1000 = 10%)" : "Value (paisa)"}
                  </Label>
                  <Input
                    id="disc-val"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percent" ? "1000" : "50000"}
                    className="h-8 text-xs font-mono mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="min-order">Minimum Order Amount (paisa)</Label>
                <Input
                  id="min-order"
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="e.g. 100000 for PKR 1,000"
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label htmlFor="usage-limit">Usage Limit (total redemptions)</Label>
                <Input
                  id="usage-limit"
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="e.g. 100"
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCouponModalOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!couponCode.trim() || !discountValue) return;
                  const val = parseInt(discountValue, 10);
                  const min = minOrder ? parseInt(minOrder, 10) : undefined;
                  const limit = usageLimit ? parseInt(usageLimit, 10) : null;

                  startTransition(async () => {
                    const res = await createCouponAction({
                      code: couponCode.trim(),
                      discountType,
                      discountValue: val,
                      minOrderAmountMinor: min,
                      usageLimit: limit,
                    });
                    setCoupons((prev) => [
                      {
                        id: res.couponId,
                        code: couponCode.trim(),
                        discount_type: discountType,
                        percent_bps: discountType === "percent" ? val : null,
                        fixed_minor: discountType === "fixed" ? val : null,
                        min_order_minor: min ?? null,
                        max_discount_minor: null,
                        starts_at: new Date().toISOString(),
                        ends_at: null,
                        usage_limit: limit,
                        used_count: 0,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                      ...prev,
                    ]);
                    setIsCouponModalOpen(false);
                    setCouponCode("");
                    setDiscountValue("");
                  });
                }}
                disabled={isPending}
                className="text-xs h-9 font-semibold"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Coupon"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
