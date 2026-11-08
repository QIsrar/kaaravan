"use client";

import React, { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { updateCourierConfigAction } from "@/lib/actions/admin";
import type { AdminCourierListItem } from "@/lib/services/admin-logistics";
import { formatPaisa } from "@/lib/format/currency";
import { Truck, Edit2, ShieldAlert, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface CouriersClientProps {
  initialCouriers: AdminCourierListItem[];
}

interface RateCard {
  baseRateMinor?: number;
  perKgMinor?: number;
  expressRateMinor?: number;
  fuelSurchargePercent?: number;
}

export function CouriersClient({ initialCouriers }: CouriersClientProps) {
  const t = useTranslations("admin");
  const [couriers, setCouriers] = useState<AdminCourierListItem[]>(initialCouriers);
  const [selectedCourier, setSelectedCourier] = useState<AdminCourierListItem | null>(null);

  // Rate card form state
  const [baseRate, setBaseRate] = useState<string>("");
  const [perKg, setPerKg] = useState<string>("");
  const [expressRate, setExpressRate] = useState<string>("");
  const [fuelSurcharge, setFuelSurcharge] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  const columns: ColumnDef<AdminCourierListItem>[] = [
    {
      header: "Courier Partner",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{row.name}</p>
            <p className="text-[11px] font-mono text-muted-foreground uppercase">
              Code: {row.code}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "COD Support",
      cell: (row) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${
            row.supports_cod
              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {row.supports_cod ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    {
      header: "Base Rate",
      cell: (row) => {
        const config = (row.config as Record<string, unknown>) || {};
        const rateCard = (config.rate_card as RateCard) || {};
        return (
          <span className="font-mono text-xs font-semibold text-foreground">
            {formatPaisa(rateCard.baseRateMinor || 25000)}
          </span>
        );
      },
    },
    {
      header: "Per KG Rate",
      cell: (row) => {
        const config = (row.config as Record<string, unknown>) || {};
        const rateCard = (config.rate_card as RateCard) || {};
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {formatPaisa(rateCard.perKgMinor || 10000)} / kg
          </span>
        );
      },
    },
    {
      header: t("status"),
      cell: (row) => (
        <Badge
          variant="outline"
          className={`text-[10px] font-semibold ${
            row.is_active
              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {row.is_active ? "Active" : "Disabled"}
        </Badge>
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
              const config = (row.config as Record<string, unknown>) || {};
              const rateCard = (config.rate_card as RateCard) || {};
              setSelectedCourier(row);
              setBaseRate(rateCard.baseRateMinor ? String(rateCard.baseRateMinor) : "25000");
              setPerKg(rateCard.perKgMinor ? String(rateCard.perKgMinor) : "10000");
              setExpressRate(rateCard.expressRateMinor ? String(rateCard.expressRateMinor) : "15000");
              setFuelSurcharge(rateCard.fuelSurchargePercent ? String(rateCard.fuelSurchargePercent) : "5");
            }}
            className="h-8 px-2.5 text-xs rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5 me-1 text-primary" />
            Rate Card
          </Button>

          <Button
            size="sm"
            onClick={() => {
              startTransition(async () => {
                await updateCourierConfigAction(row.code, {
                  isActive: !row.is_active,
                });
                setCouriers((prev) =>
                  prev.map((c) =>
                    c.code === row.code ? { ...c, is_active: !row.is_active } : c
                  )
                );
              });
            }}
            disabled={isPending}
            className={`h-8 px-2.5 text-xs font-semibold ${
              row.is_active
                ? "bg-muted text-muted-foreground hover:bg-muted/80"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {row.is_active ? "Disable" : "Enable"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Security alert card */}
      <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground">Rule 16 Compliant Credential Storage</p>
          Courier API keys, webhook signing secrets, and courier account credentials live strictly in environment variables on the server. Only operational rate cards and feature flags are stored in the database.
        </div>
      </div>

      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={couriers}
            searchPlaceholder="Search couriers by name or code..."
            searchFilter={(item, query) =>
              item.name.toLowerCase().includes(query) ||
              item.code.toLowerCase().includes(query)
            }
          />
        </CardContent>
      </Card>

      {/* Rate Card Modal */}
      {selectedCourier && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-lg font-bold text-foreground">
                Configure {selectedCourier.name} Rate Card
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCourier(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="base-rate">Base Shipment Rate (paisa, e.g. 25000 = PKR 250)</Label>
                <Input
                  id="base-rate"
                  type="number"
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="per-kg">Per Additional KG (paisa, e.g. 10000 = PKR 100)</Label>
                <Input
                  id="per-kg"
                  type="number"
                  value={perKg}
                  onChange={(e) => setPerKg(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="express-rate">Express Surcharge (paisa)</Label>
                <Input
                  id="express-rate"
                  type="number"
                  value={expressRate}
                  onChange={(e) => setExpressRate(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label htmlFor="fuel-surcharge">Fuel Surcharge (%)</Label>
                <Input
                  id="fuel-surcharge"
                  type="number"
                  value={fuelSurcharge}
                  onChange={(e) => setFuelSurcharge(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCourier(null)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  startTransition(async () => {
                    const rateCard = {
                      baseRateMinor: parseInt(baseRate, 10) || 0,
                      perKgMinor: parseInt(perKg, 10) || 0,
                      expressRateMinor: parseInt(expressRate, 10) || 0,
                      fuelSurchargePercent: parseFloat(fuelSurcharge) || 0,
                    };
                    await updateCourierConfigAction(selectedCourier.code, {
                      rateCard,
                    });
                    setCouriers((prev) =>
                      prev.map((c) =>
                        c.code === selectedCourier.code
                          ? {
                              ...c,
                              config: {
                                ...((c.config as Record<string, unknown>) || {}),
                                rate_card: rateCard,
                              },
                            }
                          : c
                      )
                    );
                    setSelectedCourier(null);
                  });
                }}
                disabled={isPending}
                className="text-xs h-9 font-semibold"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Rate Card"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

