"use client";

import React, { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { ReasonDialog } from "@/components/admin/reason-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image } from "@/components/ui/image";
import { formatPaisa } from "@/lib/format/currency";
import {
  approveProductAction,
  rejectProductAction,
  takeDownProductAction,
} from "@/lib/actions/admin";
import type { AdminProductListItem } from "@/lib/services/admin-catalog";
import {
  CheckCircle,
  XCircle,
  Archive,
  Loader2,
  Eye,
  Layers,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ProductsClientProps {
  initialProducts: AdminProductListItem[];
  currentStatus: "pending_review" | "active" | "rejected" | "archived";
}

export function ProductsClient({
  initialProducts,
  currentStatus,
}: ProductsClientProps) {
  const t = useTranslations("admin");
  const [products, setProducts] = useState<AdminProductListItem[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<AdminProductListItem | null>(null);
  const [actionPending, startActionTransition] = useTransition();

  const columns: ColumnDef<AdminProductListItem>[] = [
    {
      header: "Product",
      cell: (row) => {
        const primaryImage =
          row.product_images.find((img) => img.sort_order === 0)?.path ||
          row.product_images[0]?.path ||
          "/images/placeholder.webp";

        return (
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted/60 shrink-0 border border-border/80">
              <Image
                src={primaryImage}
                alt={row.title}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-foreground line-clamp-1">{row.title}</p>
              <p className="text-[11px] text-muted-foreground">
                /{row.slug} • {row.product_variants.length} variant(s)
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Merchant",
      cell: (row) => (
        <span className="font-medium text-foreground text-xs">
          {row.sellers?.business_name || "—"}
        </span>
      ),
    },
    {
      header: "Category",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.categories?.name || "Uncategorized"}
        </span>
      ),
    },
    {
      header: "Price",
      cell: (row) => {
        const prices = row.product_variants.map((v) => v.price_minor);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        return (
          <span className="font-mono text-xs font-semibold text-foreground">
            {minPrice === maxPrice
              ? formatPaisa(minPrice)
              : `${formatPaisa(minPrice)} - ${formatPaisa(maxPrice)}`}
          </span>
        );
      },
    },
    {
      header: "Total Stock",
      cell: (row) => {
        const totalStock = row.product_variants.reduce(
          (acc, curr) => acc + (curr.stock_quantity || 0),
          0
        );
        return (
          <span
            className={`font-mono text-xs font-semibold ${
              totalStock > 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {totalStock}
          </span>
        );
      },
    },
    {
      header: t("status"),
      cell: (row) => {
        const variants: Record<string, string> = {
          pending_review: "bg-accent/15 text-accent border-accent/30",
          active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          rejected: "bg-destructive/15 text-destructive border-destructive/30",
          archived: "bg-muted text-muted-foreground border-border",
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
      header: t("actions"),
      className: "text-end",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedProduct(row)}
            className="h-8 px-2.5 text-xs rounded-lg"
          >
            <Eye className="w-3.5 h-3.5 me-1 text-primary" />
            Inspect
          </Button>

          {row.status === "pending_review" && (
            <>
              <Button
                size="sm"
                onClick={() => {
                  startActionTransition(async () => {
                    await approveProductAction(row.id);
                    setProducts((prev) => prev.filter((p) => p.id !== row.id));
                    if (selectedProduct?.id === row.id) setSelectedProduct(null);
                  });
                }}
                disabled={actionPending}
                className="h-8 px-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {actionPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 me-1" />
                    {t("approve")}
                  </>
                )}
              </Button>

              <ReasonDialog
                title="Reject Product Submission"
                description={`Provide a specific reason for rejecting "${row.title}". The merchant will see this note in their portal.`}
                confirmLabel="Reject Product"
                onConfirm={async (reason) => {
                  await rejectProductAction(row.id, reason);
                  setProducts((prev) => prev.filter((p) => p.id !== row.id));
                  if (selectedProduct?.id === row.id) setSelectedProduct(null);
                }}
                trigger={
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-semibold"
                  >
                    <XCircle className="w-3.5 h-3.5 me-1" />
                    {t("reject")}
                  </Button>
                }
              />
            </>
          )}

          {row.status === "active" && (
            <ReasonDialog
              title="Take Down Product"
              description={`Archive and remove "${row.title}" from the public catalog. Enter the compliance/policy reason.`}
              confirmLabel="Take Down"
              onConfirm={async (reason) => {
                await takeDownProductAction(row.id, reason);
                setProducts((prev) => prev.filter((p) => p.id !== row.id));
                if (selectedProduct?.id === row.id) setSelectedProduct(null);
              }}
              trigger={
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-semibold"
                >
                  <Archive className="w-3.5 h-3.5 me-1" />
                  {t("takeDown")}
                </Button>
              }
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Moderation Queue Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { label: "Pending Review", value: "pending_review" },
          { label: "Active in Store", value: "active" },
          { label: "Rejected Submissions", value: "rejected" },
          { label: "Archived / Taken Down", value: "archived" },
        ].map((tab) => (
          <a
            key={tab.value}
            href={`/admin/products?status=${tab.value}`}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              currentStatus === tab.value
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Search products by title or seller..."
            searchFilter={(item, query) =>
              item.title.toLowerCase().includes(query) ||
              (item.sellers?.business_name?.toLowerCase().includes(query) ?? false) ||
              item.slug.toLowerCase().includes(query)
            }
          />
        </CardContent>
      </Card>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card rounded-3xl border border-border shadow-xl p-6 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {selectedProduct.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Merchant: {selectedProduct.sellers?.business_name} • Category:{" "}
                  {selectedProduct.categories?.name || "None"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProduct(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            {/* Gallery */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Product Imagery ({selectedProduct.product_images.length})
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {selectedProduct.product_images.map((img) => (
                  <div
                    key={img.id}
                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted/60 shrink-0 border border-border/80"
                  >
                    <Image
                      src={img.path}
                      alt="Product image"
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/80 text-xs text-foreground/90 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Description
              </span>
              <p className="leading-relaxed whitespace-pre-wrap">
                {selectedProduct.description || "No description provided."}
              </p>
            </div>

            {/* Rejection reason alert if present */}
            {selectedProduct.rejection_reason && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Rejection Reason</p>
                  <p className="mt-0.5">{selectedProduct.rejection_reason}</p>
                </div>
              </div>
            )}

            {/* Variants Table */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Inventory Variants ({selectedProduct.product_variants.length})
              </span>
              <div className="border border-border rounded-xl overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      <th className="py-2 px-3 text-start font-semibold">SKU</th>
                      <th className="py-2 px-3 text-start font-semibold">Price</th>
                      <th className="py-2 px-3 text-start font-semibold">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {selectedProduct.product_variants.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/20">
                        <td className="py-2 px-3 font-mono">{v.sku}</td>
                        <td className="py-2 px-3 font-mono font-medium">
                          {formatPaisa(v.price_minor)}
                        </td>
                        <td className="py-2 px-3 font-mono">{v.stock_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
