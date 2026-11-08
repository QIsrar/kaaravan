"use client";

import React, { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { ReasonDialog } from "@/components/admin/reason-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatPaisa } from "@/lib/format/currency";
import { forceSubOrderStatusAction } from "@/lib/actions/admin";
import type { AdminSubOrderListItem } from "@/lib/services/admin-orders";
import type { SubOrderStatus } from "@/lib/services/order-status";
import {
  Eye,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface OrdersClientProps {
  initialSubOrders: AdminSubOrderListItem[];
}

const ALL_STATUSES: SubOrderStatus[] = [
  "awaiting_confirmation",
  "pending",
  "confirmed",
  "packed",
  "ready_to_ship",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export function OrdersClient({ initialSubOrders }: OrdersClientProps) {
  const t = useTranslations("admin");
  const [subOrders, setSubOrders] = useState<AdminSubOrderListItem[]>(initialSubOrders);
  const [selectedOrder, setSelectedOrder] = useState<AdminSubOrderListItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [overrideStatus, setOverrideStatus] = useState<SubOrderStatus>("shipped");
  const [overrideNote, setOverrideNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = subOrders.filter((o) => {
    if (statusFilter === "all") return true;
    return o.status === statusFilter;
  });

  const columns: ColumnDef<AdminSubOrderListItem>[] = [
    {
      header: "Order #",
      cell: (row) => (
        <div>
          <p className="font-semibold text-foreground">
            {row.orders?.order_number || "—"}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            Sub: {row.id.slice(0, 8)}...
          </p>
        </div>
      ),
    },
    {
      header: "Merchant",
      cell: (row) => (
        <span className="text-xs font-medium text-foreground">
          {row.sellers?.business_name || "—"}
        </span>
      ),
    },
    {
      header: "Items",
      cell: (row) => (
        <div className="text-xs text-muted-foreground">
          {row.order_items.length} item(s)
          {row.order_items[0] && (
            <p className="text-[11px] truncate max-w-[180px] text-foreground/80">
              {row.order_items[0].product_title}
            </p>
          )}
        </div>
      ),
    },
    {
      header: t("total"),
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {formatPaisa(row.total_minor)}
        </span>
      ),
    },
    {
      header: "Payment",
      cell: (row) => (
        <div>
          <span className="text-[11px] uppercase font-semibold text-muted-foreground">
            {row.orders?.payment_method || "COD"}
          </span>
          <p className="text-[10px] capitalize text-emerald-600 dark:text-emerald-400">
            {row.orders?.payment_status || "Pending"}
          </p>
        </div>
      ),
    },
    {
      header: t("status"),
      cell: (row) => {
        const variants: Record<string, string> = {
          awaiting_confirmation: "bg-amber-500/15 text-amber-600 border-amber-500/30",
          pending: "bg-blue-500/15 text-blue-600 border-blue-500/30",
          confirmed: "bg-sky-500/15 text-sky-600 border-sky-500/30",
          packed: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
          ready_to_ship: "bg-purple-500/15 text-purple-600 border-purple-500/30",
          shipped: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
          delivered: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
          cancelled: "bg-destructive/15 text-destructive border-destructive/30",
          returned: "bg-rose-500/15 text-rose-600 border-rose-500/30",
        };
        return (
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold capitalize ${
              variants[row.status] || ""
            }`}
          >
            {row.status.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      header: t("created"),
      cell: (row) => (
        <span className="text-[11px] text-muted-foreground">
          {row.created_at.split("T")[0]}
        </span>
      ),
    },
    {
      header: t("actions"),
      className: "text-end",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedOrder(row);
              setOverrideStatus(row.status === "shipped" ? "delivered" : "shipped");
              setOverrideNote("");
            }}
            className="h-8 px-2.5 text-xs rounded-lg"
          >
            <Eye className="w-3.5 h-3.5 me-1 text-primary" />
            Inspect
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {["all", ...ALL_STATUSES].map((statusKey) => (
          <button
            key={statusKey}
            type="button"
            onClick={() => setStatusFilter(statusKey)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
              statusFilter === statusKey
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {statusKey.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={filtered}
            searchPlaceholder="Search orders by order # or merchant..."
            searchFilter={(item, query) =>
              (item.orders?.order_number?.toLowerCase().includes(query) ?? false) ||
              (item.sellers?.business_name?.toLowerCase().includes(query) ?? false) ||
              item.id.toLowerCase().includes(query)
            }
          />
        </CardContent>
      </Card>

      {/* Order Detail & Force Status Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card rounded-3xl border border-border shadow-xl p-6 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Order #{selectedOrder.orders?.order_number}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Sub-Order ID: {selectedOrder.id} • Merchant:{" "}
                  {selectedOrder.sellers?.business_name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            {/* Financial Overview Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Subtotal
                </span>
                <p className="font-mono text-sm font-bold text-foreground mt-0.5">
                  {formatPaisa(selectedOrder.subtotal_minor)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Shipping
                </span>
                <p className="font-mono text-sm font-bold text-foreground mt-0.5">
                  {formatPaisa(selectedOrder.shipping_minor)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Total
                </span>
                <p className="font-mono text-sm font-bold text-primary mt-0.5">
                  {formatPaisa(selectedOrder.total_minor)}
                </p>
              </div>
            </div>

            {/* Order Items List */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Order Items ({selectedOrder.order_items.length})
              </span>
              <div className="border border-border rounded-xl divide-y divide-border/60 text-xs overflow-hidden">
                {selectedOrder.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between bg-card"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.product_title}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Qty: {item.quantity} × {formatPaisa(item.unit_price_minor)}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-foreground">
                      {formatPaisa(item.line_total_minor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Override Section */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                Administrative Governance Override
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Superadmin / manage_orders staff can force status transitions or force-cancel orders even after packing. A mandatory audit reason is recorded in the immutable order history.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <Label htmlFor="target-status">Select New Status</Label>
                  <select
                    id="target-status"
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value as SubOrderStatus)}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-card text-foreground mt-1"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="override-note">Audit Note / Reason *</Label>
                  <input
                    id="override-note"
                    value={overrideNote}
                    onChange={(e) => setOverrideNote(e.target.value)}
                    placeholder="Mandatory reason for override"
                    className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-card text-foreground mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <ReasonDialog
                  title="Force Cancel Order"
                  description="This will immediately cancel the order and trigger payment refund / inventory rollback logic. Enter mandatory note."
                  confirmLabel="Force Cancel Order"
                  onConfirm={async (reason) => {
                    await forceSubOrderStatusAction(
                      selectedOrder.id,
                      "cancelled",
                      reason
                    );
                    setSubOrders((prev) =>
                      prev.map((o) =>
                        o.id === selectedOrder.id ? { ...o, status: "cancelled" } : o
                      )
                    );
                    setSelectedOrder(null);
                  }}
                  trigger={
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-xs h-8"
                    >
                      {t("forceCancel")}
                    </Button>
                  }
                />

                <Button
                  size="sm"
                  onClick={() => {
                    if (!overrideNote.trim()) return;
                    startTransition(async () => {
                      await forceSubOrderStatusAction(
                        selectedOrder.id,
                        overrideStatus,
                        overrideNote.trim()
                      );
                      setSubOrders((prev) =>
                        prev.map((o) =>
                          o.id === selectedOrder.id ? { ...o, status: overrideStatus } : o
                        )
                      );
                      setSelectedOrder(null);
                    });
                  }}
                  disabled={isPending || !overrideNote.trim()}
                  className="text-xs h-8 font-semibold bg-primary text-primary-foreground"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin me-1.5" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 me-1.5" />
                  )}
                  Apply Status Override
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
