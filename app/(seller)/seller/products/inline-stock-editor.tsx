"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateVariantStockAction } from "@/lib/actions/seller-products";

export interface VariantStockItem {
  id: string;
  sku: string;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  attributes: Record<string, string> | null;
}

interface InlineStockEditorProps {
  productId: string;
  variants: VariantStockItem[];
}

export function InlineStockEditor({ productId, variants: initialVariants }: InlineStockEditorProps) {
  const t = useTranslations("seller.catalog");
  const [isOpen, setIsOpen] = useState(false);
  const [variants, setVariants] = useState<VariantStockItem[]>(initialVariants);
  const [stockInputs, setStockInputs] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const v of initialVariants) {
      map[v.id] = v.stock_quantity;
    }
    return map;
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStockChange = (variantId: string, val: number) => {
    setStockInputs((prev) => ({ ...prev, [variantId]: val }));
  };

  const handleSaveStock = async (variant: VariantStockItem) => {
    const newStock = stockInputs[variant.id] ?? variant.stock_quantity;

    if (newStock < variant.reserved_quantity) {
      toast.error(`Stock cannot be lower than reserved quantity (${variant.reserved_quantity})`);
      return;
    }

    setUpdatingId(variant.id);
    try {
      const res = await updateVariantStockAction(variant.id, newStock, productId);
      if (!res.success) {
        throw new Error(res.error || "Failed to update stock");
      }

      setVariants((prev) =>
        prev.map((v) => (v.id === variant.id ? { ...v, stock_quantity: newStock } : v))
      );
      toast.success(t("stockUpdated"));
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to update stock");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="border-t border-border/60 pt-3 mt-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>{t("quickStockEdit")}</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <span className="text-[11px] text-muted-foreground font-mono">
          {variants.length} {variants.length === 1 ? "variant" : "variants"}
        </span>
      </div>

      {isOpen && (
        <div className="mt-3 space-y-2 bg-muted/20 p-3 rounded-xl border border-border/50">
          {variants.map((v) => {
            const available = v.stock_quantity - v.reserved_quantity;
            const isLow = available <= v.low_stock_threshold;
            const isSavingThis = updatingId === v.id;
            const currentInputValue = stockInputs[v.id] ?? v.stock_quantity;
            const hasChanged = currentInputValue !== v.stock_quantity;

            const attrLabel =
              v.attributes && Object.keys(v.attributes).length > 0
                ? Object.entries(v.attributes)
                    .map(([k, val]) => `${k}: ${val}`)
                    .join(" · ")
                : "Default";

            return (
              <div
                key={v.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-card border border-border/60 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-medium text-foreground">{v.sku}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {attrLabel}
                    </Badge>
                    {isLow && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        {t("lowStockBadge")}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Available: <span className="font-mono font-semibold">{available}</span>
                    {v.reserved_quantity > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 ms-1.5">
                        ({v.reserved_quantity} reserved)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    type="number"
                    min={v.reserved_quantity}
                    value={currentInputValue}
                    onChange={(e) =>
                      handleStockChange(v.id, parseInt(e.target.value, 10) || 0)
                    }
                    className="w-20 h-8 font-mono text-xs rounded-lg"
                    disabled={isSavingThis}
                  />

                  <Button
                    type="button"
                    size="sm"
                    disabled={isSavingThis || !hasChanged}
                    onClick={() => handleSaveStock(v)}
                    className="h-8 px-2.5 rounded-lg text-xs"
                    variant={hasChanged ? "default" : "outline"}
                  >
                    {isSavingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 me-1" />
                    )}
                    {t("saveStock")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
