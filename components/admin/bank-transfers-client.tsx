/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

"use client";

import React, { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { ReasonDialog } from "@/components/admin/reason-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  approveBankTransferProofAction,
  rejectBankTransferProofAction,
} from "@/lib/actions/admin";
import type { AdminBankTransferProofItem } from "@/lib/services/admin-finance";
import { formatPaisa } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { CheckCircle2, XCircle, ExternalLink, Receipt, User, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

interface BankTransfersClientProps {
  initialProofs: AdminBankTransferProofItem[];
}

export function BankTransfersClient({ initialProofs }: BankTransfersClientProps) {
  const t = useTranslations("admin");
  const [proofs, setProofs] = useState<AdminBankTransferProofItem[]>(initialProofs);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [, startActionTransition] = useTransition();

  const filtered = proofs.filter((p) => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  const columns: ColumnDef<AdminBankTransferProofItem>[] = [
    {
      header: t("orders"),
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">
              {row.orderNumber}
            </span>
            {row.customer.isGuest && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Guest
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            {formatDate(row.createdAt)}
          </p>
        </div>
      ),
    },
    {
      header: t("customerDetails"),
      cell: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{row.customer.fullName || "Customer"}</span>
          </div>
          {row.customer.email && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <Mail className="w-3 h-3 shrink-0" />
              <span>{row.customer.email}</span>
            </div>
          )}
          {row.customer.phone && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <Phone className="w-3 h-3 shrink-0" />
              <span className="font-mono">{row.customer.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Amount",
      cell: (row) => (
        <div className="font-heading font-bold text-sm text-foreground">
          {formatPaisa(row.totalMinor)}
        </div>
      ),
    },
    {
      header: t("proofSlip"),
      cell: (row) => {
        if (!row.signedUrl) {
          return (
            <span className="text-xs text-muted-foreground italic">
              No preview available
            </span>
          );
        }
        return (
          <a
            href={row.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{t("viewProof")}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      },
    },
    {
      header: t("proofStatus"),
      cell: (row) => {
        if (row.status === "approved") {
          return (
            <Badge variant="default" className="text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700">
              {t("verifiedByAdmin")}
            </Badge>
          );
        }
        if (row.status === "rejected") {
          return (
            <Badge variant="destructive" className="text-[11px] font-semibold">
              {t("rejectedVerification")}
            </Badge>
          );
        }
        return (
          <Badge variant="accent" className="text-[11px] font-semibold">
            {t("pendingVerification")}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      cell: (row) => {
        if (row.status !== "pending") {
          return <span className="text-xs text-muted-foreground font-mono">—</span>;
        }

        return (
          <div className="flex items-center gap-2">
            <ReasonDialog
              title={t("approveProofTitle")}
              description={t("approveProofDesc")}
              confirmLabel={t("approve")}
              variant="default"
              requireReason={false}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 me-1" />
                  {t("approve")}
                </Button>
              }
              onConfirm={async (note) => {
                startActionTransition(async () => {
                  const res = await approveBankTransferProofAction(row.id, note);
                  if (res?.success) {
                    setProofs((prev) =>
                      prev.map((p) =>
                        p.id === row.id ? { ...p, status: "approved", paymentStatus: "paid" } : p
                      )
                    );
                  }
                });
              }}
            />

            <ReasonDialog
              title={t("rejectProofTitle")}
              description={t("rejectProofDesc")}
              confirmLabel={t("reject")}
              variant="destructive"
              requireReason={true}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="w-3.5 h-3.5 me-1" />
                  {t("reject")}
                </Button>
              }
              onConfirm={async (reason) => {
                startActionTransition(async () => {
                  const res = await rejectBankTransferProofAction(row.id, reason);
                  if (res?.success) {
                    setProofs((prev) =>
                      prev.map((p) =>
                        p.id === row.id ? { ...p, status: "rejected", paymentStatus: "failed" } : p
                      )
                    );
                  }
                });
              }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "default" : "outline"}
            className="rounded-xl text-xs capitalize h-8"
            onClick={() => setStatusFilter(status)}
          >
            {status}
            {status === "pending" && (
              <span className="ms-1.5 px-1.5 py-0.2 bg-background/20 rounded-full text-[10px] font-bold">
                {proofs.filter((p) => p.status === "pending").length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-border bg-card">
          <CardContent className="p-12 text-center space-y-2">
            <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto stroke-[1.5]" />
            <p className="text-sm font-semibold text-foreground">{t("noProofsFound")}</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {t("bankTransfersDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search order number..."
          searchFilter={(item, query) =>
            item.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
            (item.customer.fullName?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
            (item.customer.email?.toLowerCase().includes(query.toLowerCase()) ?? false)
          }
        />
      )}
    </div>
  );
}
