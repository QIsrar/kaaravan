"use client";

import React, { useState } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminAuditLogItem } from "@/lib/services/admin-audit";
import { Eye, Terminal } from "lucide-react";
import { useTranslations } from "next-intl";

interface AuditClientProps {
  initialLogs: AdminAuditLogItem[];
}

export function AuditClient({ initialLogs }: AuditClientProps) {
  const t = useTranslations("admin");
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const filteredLogs = initialLogs.filter((log) => {
    if (entityFilter === "all") return true;
    return log.entity === entityFilter;
  });

  const columns: ColumnDef<AdminAuditLogItem>[] = [
    {
      header: "Action",
      cell: (row) => (
        <Badge
          variant="outline"
          className="text-[10px] font-mono font-semibold bg-muted text-foreground border-border"
        >
          {row.action}
        </Badge>
      ),
    },
    {
      header: "Entity",
      cell: (row) => (
        <div>
          <span className="font-semibold text-foreground text-xs uppercase tracking-wider">
            {row.entity}
          </span>
          <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
            {row.entity_id || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Actor",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground text-xs">
            {row.profiles?.full_name || "System"}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {row.actor_id ? `${row.actor_id.slice(0, 8)}...` : "Automated"}
          </p>
        </div>
      ),
    },
    {
      header: "IP Address",
      cell: (row) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {row.ip || "127.0.0.1"}
        </span>
      ),
    },
    {
      header: "Timestamp",
      cell: (row) => (
        <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          {row.created_at.replace("T", " ").slice(0, 19)}
        </span>
      ),
    },
    {
      header: t("actions"),
      className: "text-end",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedLog(row)}
          className="h-8 px-2.5 text-xs rounded-lg"
        >
          <Eye className="w-3.5 h-3.5 me-1 text-primary" />
          Payload
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Entity Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { label: "All Entities", value: "all" },
          { label: "Sellers", value: "sellers" },
          { label: "Products", value: "products" },
          { label: "Orders", value: "sub_orders" },
          { label: "Couriers", value: "couriers" },
          { label: "Banners", value: "banners" },
          { label: "Coupons", value: "coupons" },
          { label: "Settings", value: "settings" },
          { label: "Permissions", value: "admin_permissions" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setEntityFilter(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              entityFilter === tab.value
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
            data={filteredLogs}
            searchPlaceholder="Search logs by action or entity ID..."
            searchFilter={(item, query) =>
              item.action.toLowerCase().includes(query) ||
              item.entity.toLowerCase().includes(query) ||
              (item.entity_id?.toLowerCase().includes(query) ?? false) ||
              (item.profiles?.full_name?.toLowerCase().includes(query) ?? false)
            }
          />
        </CardContent>
      </Card>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card rounded-3xl border border-border shadow-xl p-6 max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Audit Entry: {selectedLog.action}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedLog.entity} • ID: {selectedLog.entity_id || "N/A"} • IP:{" "}
                  {selectedLog.ip}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" />
                  Before Mutation State
                </span>
                <pre className="p-3 rounded-2xl bg-muted/50 border border-border/80 font-mono text-[10px] overflow-x-auto max-h-60 leading-relaxed">
                  {selectedLog.before
                    ? JSON.stringify(selectedLog.before, null, 2)
                    : "(No before state / Creation event)"}
                </pre>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1 text-primary">
                  <Terminal className="w-3.5 h-3.5" />
                  After Mutation State
                </span>
                <pre className="p-3 rounded-2xl bg-muted/50 border border-border/80 font-mono text-[10px] overflow-x-auto max-h-60 leading-relaxed text-foreground">
                  {selectedLog.after
                    ? JSON.stringify(selectedLog.after, null, 2)
                    : "(No after state / Deletion event)"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
