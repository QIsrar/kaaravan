"use client";

import React, { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { ReasonDialog } from "@/components/admin/reason-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  approveSellerAction,
  rejectSellerAction,
  suspendSellerAction,
  unsuspendSellerAction,
  setSellerCommissionAction,
} from "@/lib/actions/admin";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  Loader2,
  Eye,
  Percent,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { AdminSellerListItem } from "@/lib/services/admin-sellers";

interface SellersClientProps {
  initialSellers: AdminSellerListItem[];
}

export function SellersClient({ initialSellers }: SellersClientProps) {
  const t = useTranslations("admin");
  const [selectedSeller, setSelectedSeller] = useState<AdminSellerListItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [overrideBps, setOverrideBps] = useState<string>("");
  const [isCommissionPending, startCommissionTransition] = useTransition();
  const [actionPending, startActionTransition] = useTransition();

  const filteredSellers = initialSellers.filter((s) => {
    if (statusFilter === "all") return true;
    return s.status === statusFilter;
  });

  const columns: ColumnDef<AdminSellerListItem>[] = [
    {
      header: t("businessName"),
      accessorKey: "business_name",
      cell: (row) => (
        <div>
          <p className="font-semibold text-foreground">{row.business_name}</p>
          <p className="text-[11px] text-muted-foreground">/{row.slug}</p>
        </div>
      ),
    },
    {
      header: t("owner"),
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">
            {row.profiles?.full_name || "—"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {row.profiles?.phone || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Business Type",
      cell: (row) => (
        <span className="capitalize text-muted-foreground text-[11px]">
          {row.business_type || "Individual"}
        </span>
      ),
    },
    {
      header: "Commission",
      cell: (row) => (
        <span className="font-mono text-xs">
          {row.commission_rate_bps !== null
            ? `${(row.commission_rate_bps / 100).toFixed(1)}%`
            : "Default (5.0%)"}
        </span>
      ),
    },
    {
      header: t("status"),
      cell: (row) => {
        const variants: Record<string, string> = {
          pending: "bg-accent/15 text-accent border-accent/30",
          approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          rejected: "bg-destructive/15 text-destructive border-destructive/30",
          suspended: "bg-muted text-muted-foreground border-border",
        };
        return (
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold capitalize ${
              variants[row.status] || ""
            }`}
          >
            {row.status}
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
              setSelectedSeller(row);
              setOverrideBps(
                row.commission_rate_bps !== null
                  ? String(row.commission_rate_bps)
                  : ""
              );
            }}
            className="h-8 px-2.5 text-xs rounded-lg"
          >
            <Eye className="w-3.5 h-3.5 me-1 text-primary" />
            Review
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { label: "All Sellers", value: "all" },
          { label: "Pending Verification", value: "pending" },
          { label: "Approved Merchants", value: "approved" },
          { label: "Rejected", value: "rejected" },
          { label: "Suspended", value: "suspended" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={filteredSellers}
            searchPlaceholder="Search sellers by business or owner name..."
            searchFilter={(item, query) =>
              item.business_name.toLowerCase().includes(query) ||
              (item.profiles?.full_name?.toLowerCase().includes(query) ?? false) ||
              (item.profiles?.phone?.includes(query) ?? false)
            }
          />
        </CardContent>
      </Card>

      {/* Seller Detail Drawer / Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card rounded-3xl border border-border shadow-xl p-6 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {selectedSeller.business_name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Slug: /{selectedSeller.slug} • Owner:{" "}
                  {selectedSeller.profiles?.full_name || "N/A"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSeller(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            {/* Merchant Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {t("contactAndPhone")}
                </span>
                <p className="font-medium text-foreground">
                  {selectedSeller.profiles?.phone || "No phone recorded"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Owner Profile ID: {selectedSeller.owner_profile_id.slice(0, 8)}...
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {t("kycAndTax")}
                </span>
                <p className="font-medium text-foreground">
                  CNIC:{" "}
                  {selectedSeller.seller_kyc?.cnic_number || "Not submitted"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  NTN: {selectedSeller.seller_kyc?.ntn || "N/A"}
                </p>
              </div>

              <div className="sm:col-span-2 p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {t("registeredBank")}
                </span>
                {selectedSeller.seller_bank_accounts?.[0] ? (
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedSeller.seller_bank_accounts[0].bank_name} •{" "}
                      {selectedSeller.seller_bank_accounts[0].account_title}
                    </p>
                    <p className="font-mono text-xs text-primary font-semibold">
                      {selectedSeller.seller_bank_accounts[0].iban}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No bank account linked</p>
                )}
              </div>
            </div>

            {/* KYC Documents Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {t("documents")}
              </h4>
              {selectedSeller.seller_documents &&
              selectedSeller.seller_documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedSeller.seller_documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-medium capitalize">
                          {doc.doc_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <a
                        href={`/api/v1/admin/sellers/${selectedSeller.id}/kyc-document?filePath=${encodeURIComponent(doc.file_path)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                      >
                        {t("viewDocument")}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No verification documents uploaded.
                </p>
              )}
            </div>

            {/* Commission Override Input */}
            <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-2">
              <Label htmlFor="comm-rate" className="text-xs font-semibold">
                {t("overrideCommission")}
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="comm-rate"
                    type="number"
                    value={overrideBps}
                    onChange={(e) => setOverrideBps(e.target.value)}
                    placeholder="e.g. 500 for 5.0%"
                    className="h-8 text-xs font-mono"
                  />
                  <Percent className="absolute end-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const parsed = overrideBps ? parseInt(overrideBps, 10) : null;
                    startCommissionTransition(async () => {
                      await setSellerCommissionAction(selectedSeller.id, parsed);
                      setSelectedSeller({
                        ...selectedSeller,
                        commission_rate_bps: parsed,
                      });
                    });
                  }}
                  disabled={isCommissionPending}
                  className="h-8 text-xs"
                >
                  {isCommissionPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Save Rate"
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Leave empty or null to use system category default.
              </p>
            </div>

            {/* Governance Action Buttons */}
            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-end gap-2">
              {selectedSeller.status === "pending" && (
                <>
                  <Button
                    onClick={() => {
                      startActionTransition(async () => {
                        await approveSellerAction(selectedSeller.id);
                        setSelectedSeller({
                          ...selectedSeller,
                          status: "approved",
                        });
                      });
                    }}
                    disabled={actionPending}
                    className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {actionPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin me-1.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 me-1.5" />
                    )}
                    {t("approve")}
                  </Button>

                  <ReasonDialog
                    title="Reject Seller Application"
                    description={`Are you sure you want to reject ${selectedSeller.business_name}? Please provide the specific KYC deficiency.`}
                    confirmLabel="Reject Application"
                    onConfirm={async (reason) => {
                      await rejectSellerAction(selectedSeller.id, reason);
                      setSelectedSeller({
                        ...selectedSeller,
                        status: "rejected",
                        status_reason: reason,
                      });
                    }}
                    trigger={
                      <Button
                        variant="destructive"
                        className="h-9 px-4 text-xs font-semibold"
                      >
                        <XCircle className="w-4 h-4 me-1.5" />
                        {t("reject")}
                      </Button>
                    }
                  />
                </>
              )}

              {selectedSeller.status === "approved" && (
                <ReasonDialog
                  title="Suspend Merchant Account"
                  description={`Suspending ${selectedSeller.business_name} will hide all their products from the store and block new orders.`}
                  confirmLabel="Suspend Merchant"
                  onConfirm={async (reason) => {
                    await suspendSellerAction(selectedSeller.id, reason);
                    setSelectedSeller({
                      ...selectedSeller,
                      status: "suspended",
                      status_reason: reason,
                    });
                  }}
                  trigger={
                    <Button
                      variant="destructive"
                      className="h-9 px-4 text-xs font-semibold"
                    >
                      <AlertTriangle className="w-4 h-4 me-1.5" />
                      {t("suspend")}
                    </Button>
                  }
                />
              )}

              {selectedSeller.status === "suspended" && (
                <Button
                  onClick={() => {
                    startActionTransition(async () => {
                      await unsuspendSellerAction(selectedSeller.id);
                      setSelectedSeller({
                        ...selectedSeller,
                        status: "approved",
                      });
                    });
                  }}
                  disabled={actionPending}
                  className="h-9 px-4 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {actionPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin me-1.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 me-1.5" />
                  )}
                  {t("unsuspend")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
