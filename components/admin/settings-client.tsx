"use client";

import React, { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { updateSettingAction } from "@/lib/actions/admin";
import type { AdminSettingListItem } from "@/lib/services/admin-settings";
import { Edit2, Loader2, Globe, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

interface SettingsClientProps {
  initialSettings: AdminSettingListItem[];
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const t = useTranslations("admin");
  const [settings, setSettings] = useState<AdminSettingListItem[]>(initialSettings);
  const [selectedSetting, setSelectedSetting] = useState<AdminSettingListItem | null>(null);
  const [editJson, setEditJson] = useState("");
  const [editPublic, setEditPublic] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns: ColumnDef<AdminSettingListItem>[] = [
    {
      header: "Setting Key",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {row.key}
        </span>
      ),
    },
    {
      header: "Value Preview",
      cell: (row) => (
        <pre className="font-mono text-[11px] text-muted-foreground truncate max-w-xs">
          {JSON.stringify(row.value)}
        </pre>
      ),
    },
    {
      header: "Visibility (is_public)",
      cell: (row) => (
        <Badge
          variant="outline"
          className={`text-[10px] flex items-center gap-1 w-fit ${
            row.is_public
              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {row.is_public ? (
            <>
              <Globe className="w-3 h-3" /> Public
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" /> Private / Admin Only
            </>
          )}
        </Badge>
      ),
    },
    {
      header: "Last Updated",
      cell: (row) => (
        <span className="text-[11px] text-muted-foreground">
          {row.updated_at.split("T")[0]}
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
              setSelectedSetting(row);
              setEditJson(JSON.stringify(row.value, null, 2));
              setEditPublic(row.is_public);
              setJsonError(null);
            }}
            className="h-8 px-2.5 text-xs rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5 me-1 text-primary" />
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={settings}
            searchPlaceholder="Search settings by key..."
            searchFilter={(item, query) =>
              item.key.toLowerCase().includes(query)
            }
          />
        </CardContent>
      </Card>

      {/* Edit Setting Modal */}
      {selectedSetting && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Edit Setting
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedSetting.key}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSetting(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="setting-json">JSON Value</Label>
                <Textarea
                  id="setting-json"
                  value={editJson}
                  onChange={(e) => {
                    setEditJson(e.target.value);
                    if (jsonError) setJsonError(null);
                  }}
                  className="font-mono text-xs min-h-[140px] mt-1"
                />
                {jsonError && (
                  <p className="text-xs text-destructive mt-1">{jsonError}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="setting-public"
                  checked={editPublic}
                  onChange={(e) => setEditPublic(e.target.checked)}
                  className="rounded border-border text-primary"
                />
                <Label htmlFor="setting-public">
                  is_public (Exposed via public settings API to store clients)
                </Label>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSetting(null)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(editJson);
                    startTransition(async () => {
                      await updateSettingAction(selectedSetting.key, {
                        value: parsed,
                        isPublic: editPublic,
                      });
                      setSettings((prev) =>
                        prev.map((s) =>
                          s.key === selectedSetting.key
                            ? {
                                ...s,
                                value: parsed,
                                is_public: editPublic,
                                updated_at: new Date().toISOString(),
                              }
                            : s
                        )
                      );
                      setSelectedSetting(null);
                    });
                  } catch (e) {
                    setJsonError(e instanceof Error ? e.message : "Invalid JSON");
                  }
                }}
                disabled={isPending}
                className="text-xs h-9 font-semibold"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Setting"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
