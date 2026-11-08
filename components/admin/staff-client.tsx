"use client";

import React, { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  updateStaffPermissionsAction,
  promoteStaffAction,
} from "@/lib/actions/admin";
import type { AdminStaffListItem } from "@/lib/services/admin-staff";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/validators/admin";
import {
  UserCheck,
  Shield,
  ShieldCheck,
  Plus,
  Edit2,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface StaffClientProps {
  initialStaff: AdminStaffListItem[];
}

export function StaffClient({ initialStaff }: StaffClientProps) {
  const t = useTranslations("admin");
  const [staffList, setStaffList] = useState<AdminStaffListItem[]>(initialStaff);
  const [selectedStaff, setSelectedStaff] = useState<AdminStaffListItem | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<AdminPermission[]>([]);

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const columns: ColumnDef<AdminStaffListItem>[] = [
    {
      header: "Staff Member",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {row.role === "superadmin" ? (
              <ShieldCheck className="w-4 h-4 text-accent" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {row.fullName || "Admin User"}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">
              {row.email || row.phone || row.id.slice(0, 8)}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (row) => (
        <Badge
          variant="outline"
          className={`text-[10px] font-semibold uppercase ${
            row.role === "superadmin"
              ? "bg-accent/15 text-accent border-accent/30"
              : "bg-primary/15 text-primary border-primary/30"
          }`}
        >
          {row.role.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      header: "Assigned Permissions",
      cell: (row) => {
        if (row.role === "superadmin") {
          return (
            <span className="text-xs text-accent font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Full Governance Access (All)
            </span>
          );
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-sm">
            {row.permissions.length > 0 ? (
              row.permissions.map((p) => (
                <span
                  key={p}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-muted/60 text-muted-foreground font-mono"
                >
                  {p.replace("manage_", "")}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-muted-foreground italic">
                No permissions assigned
              </span>
            )}
          </div>
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
        if (row.role === "superadmin") return null;

        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStaff(row);
              setSelectedPerms(row.permissions);
            }}
            className="h-8 px-2.5 text-xs rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5 me-1 text-primary" />
            Permissions
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setInviteEmail("");
            setInviteError(null);
            setIsInviteOpen(true);
          }}
          className="text-xs h-9 font-semibold"
        >
          <Plus className="w-4 h-4 me-1.5" />
          Assign Admin Staff
        </Button>
      </div>

      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={staffList}
            searchPlaceholder="Search staff by name or email..."
            searchFilter={(item, query) =>
              (item.fullName?.toLowerCase().includes(query) ?? false) ||
              (item.email?.toLowerCase().includes(query) ?? false)
            }
          />
        </CardContent>
      </Card>

      {/* Permissions Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Staff Permissions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Configure operational access for {selectedStaff.fullName || selectedStaff.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStaff(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pe-1">
              {ADMIN_PERMISSIONS.map((perm) => {
                const isChecked = selectedPerms.includes(perm);
                return (
                  <label
                    key={perm}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/80 hover:bg-muted/30 cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground font-mono">
                        {perm}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSelectedPerms(selectedPerms.filter((p) => p !== perm));
                        } else {
                          setSelectedPerms([...selectedPerms, perm]);
                        }
                      }}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                  </label>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStaff(null)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  startTransition(async () => {
                    await updateStaffPermissionsAction(
                      selectedStaff.id,
                      selectedPerms
                    );
                    setStaffList((prev) =>
                      prev.map((s) =>
                        s.id === selectedStaff.id
                          ? { ...s, permissions: selectedPerms }
                          : s
                      )
                    );
                    setSelectedStaff(null);
                  });
                }}
                disabled={isPending}
                className="text-xs h-9 font-semibold"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Save Permissions"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-3xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <h3 className="font-heading text-lg font-bold text-foreground">
              Assign Staff Role
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter the registered email of the user to assign them the <code className="font-mono">admin_staff</code> role.
            </p>

            <div className="space-y-2 text-xs">
              <Label htmlFor="staff-email">User Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  if (inviteError) setInviteError(null);
                }}
                placeholder="staff@kaaravan.pk"
                className="h-8 text-xs mt-1"
                required
              />
              {inviteError && (
                <p className="text-xs text-destructive font-medium">{inviteError}</p>
              )}
            </div>

            <div className="pt-2 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInviteOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!inviteEmail.trim()) return;
                  startTransition(async () => {
                    try {
                      await promoteStaffAction(inviteEmail.trim());
                      setIsInviteOpen(false);
                      setInviteEmail("");
                      // Refresh page to load new profile
                      window.location.reload();
                    } catch (err) {
                      setInviteError(
                        err instanceof Error ? err.message : "Failed to assign staff"
                      );
                    }
                  });
                }}
                disabled={isPending}
                className="text-xs h-9 font-semibold"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Assign Staff"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
