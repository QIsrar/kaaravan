"use client";

import React, { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { ReasonDialog } from "@/components/admin/reason-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  approveBankChangeAction,
  rejectBankChangeAction,
} from "@/lib/actions/admin";
import type { AdminBankChangeRequestItem } from "@/lib/services/admin-finance";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface BankRequestsClientProps {
  initialRequests: AdminBankChangeRequestItem[];
}

export function BankRequestsClient({ initialRequests }: BankRequestsClientProps) {
  const t = useTranslations("admin");
  const [requests, setRequests] = useState<AdminBankChangeRequestItem[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionPending, startActionTransition] = useTransition();

  const filtered = requests.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const columns: ColumnDef<AdminBankChangeRequestItem>[] = [
    {
      header: t("businessName"),
      cell: (row) => (
        <div>
          <p className="font-semibold text-foreground">
            {row.sellers?.business_name || "Unknown Merchant"}
          </p>
          <p className="text-[11px] text-muted-foreground">/{row.sellers?.slug}</p>
        </div>
      ),
    },
    {
      header: "Requested Bank & Title",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.bank_name}</p>
          <p className="text-[11px] text-muted-foreground">{row.account_title}</p>
        </div>
      ),
    },
    {
      header: "New IBAN",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.ibanMasked}
        </span>
      ),
    },
    {
      header: "Merchant Reason",
      cell: (row) => (
        <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
          {row.reason || "No reason given"}
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
      cell: (row) => {
        if (row.status !== "pending") return null;

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              onClick={() => {
                startActionTransition(async () => {
                  await approveBankChangeAction(row.id);
                  setRequests((prev) =>
                    prev.map((item) =>
                      item.id === row.id ? { ...item, status: "approved" } : item
                    )
                  );
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
              title="Reject Bank Change Request"
              description={`Are you sure you want to reject the bank change request for ${
                row.sellers?.business_name || "this merchant"
              }?`}
              confirmLabel="Reject Request"
              onConfirm={async (reason) => {
                await rejectBankChangeAction(row.id, reason);
                setRequests((prev) =>
                  prev.map((item) =>
                    item.id === row.id ? { ...item, status: "rejected" } : item
                  )
                );
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
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { label: "All Requests", value: "all" },
          { label: "Pending Review", value: "pending" },
          { label: "Approved Changes", value: "approved" },
          { label: "Rejected Requests", value: "rejected" },
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

      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={filtered}
            searchPlaceholder="Search by merchant name or bank title..."
            searchFilter={(item, query) =>
              (item.sellers?.business_name?.toLowerCase().includes(query) ?? false) ||
              item.bank_name.toLowerCase().includes(query) ||
              item.account_title.toLowerCase().includes(query)
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

