"use client";

import React, { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { ReasonDialog } from "@/components/admin/reason-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  suspendCustomerAction,
  unsuspendCustomerAction,
} from "@/lib/actions/admin";
import type { AdminCustomerListItem } from "@/lib/services/admin-users";
import { UserX, UserCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface CustomersClientProps {
  initialCustomers: AdminCustomerListItem[];
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const t = useTranslations("admin");
  const [customers, setCustomers] = useState<AdminCustomerListItem[]>(initialCustomers);
  const [actionPending, startActionTransition] = useTransition();

  const columns: ColumnDef<AdminCustomerListItem>[] = [
    {
      header: "Customer",
      cell: (row) => (
        <div>
          <p className="font-semibold text-foreground">
            {row.fullName || "Registered Customer"}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            ID: {row.id.slice(0, 8)}...
          </p>
        </div>
      ),
    },
    {
      header: t("phone"),
      cell: (row) => (
        <span className="font-mono text-xs text-foreground">
          {row.phone || "—"}
        </span>
      ),
    },
    {
      header: t("ordersCount"),
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {row.orderCount} order(s)
        </span>
      ),
    },
    {
      header: t("status"),
      cell: (row) => {
        const isSuspended = row.status === "suspended";
        return (
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold capitalize ${
              isSuspended
                ? "bg-destructive/15 text-destructive border-destructive/30"
                : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
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
          {row.createdAt.split("T")[0]}
        </span>
      ),
    },
    {
      header: t("actions"),
      className: "text-end",
      cell: (row) => {
        const isSuspended = row.status === "suspended";
        return (
          <div className="flex items-center justify-end gap-1.5">
            {isSuspended ? (
              <Button
                size="sm"
                onClick={() => {
                  startActionTransition(async () => {
                    await unsuspendCustomerAction(row.id);
                    setCustomers((prev) =>
                      prev.map((c) =>
                        c.id === row.id ? { ...c, status: "active" } : c
                      )
                    );
                  });
                }}
                disabled={actionPending}
                className="h-8 px-2.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {actionPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin me-1" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 me-1" />
                )}
                {t("unsuspend")}
              </Button>
            ) : (
              <ReasonDialog
                title="Suspend Customer Account"
                description={`Suspending ${
                  row.fullName || "this customer"
                } will terminate active sessions and block checkout.`}
                confirmLabel="Suspend Customer"
                onConfirm={async (reason) => {
                  await suspendCustomerAction(row.id, reason);
                  setCustomers((prev) =>
                    prev.map((c) =>
                      c.id === row.id ? { ...c, status: "suspended" } : c
                    )
                  );
                }}
                trigger={
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-semibold"
                  >
                    <UserX className="w-3.5 h-3.5 me-1" />
                    {t("suspend")}
                  </Button>
                }
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Card className="rounded-2xl border-border bg-card">
      <CardContent className="p-4 sm:p-6">
        <DataTable
          columns={columns}
          data={customers}
          searchPlaceholder="Search customers by name or phone..."
          searchFilter={(item, query) =>
            (item.fullName?.toLowerCase().includes(query) ?? false) ||
            (item.phone?.includes(query) ?? false) ||
            item.id.toLowerCase().includes(query)
          }
        />
      </CardContent>
    </Card>
  );
}

