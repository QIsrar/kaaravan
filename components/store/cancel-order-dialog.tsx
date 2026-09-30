"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Ban } from "lucide-react";
import { cancelSubOrderAction } from "@/lib/actions/customer_orders";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface CancelSubOrderDialogProps {
  subOrderId: string;
  sellerName: string;
}

export function CancelSubOrderDialog({
  subOrderId,
  sellerName,
}: CancelSubOrderDialogProps) {
  const t = useTranslations("orders");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const trimmedReason = reason.trim();
  const isValid = trimmedReason.length >= 10 && trimmedReason.length <= 500;

  const handleCancel = async () => {
    if (!isValid) {
      setErrorMsg(t("cancelValidation"));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await cancelSubOrderAction(subOrderId, trimmedReason);
      toast.success(t("cancelSuccess"));
      setOpen(false);
      setReason("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("cancelError");
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold gap-1.5 h-8 px-3"
          />
        }
      >
        <Ban className="w-3.5 h-3.5" />
        <span>{t("cancelPackage")}</span>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold text-foreground">
            {t("cancelDialogTitle", { seller: sellerName })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            {t("cancelDialogDesc", { seller: sellerName })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-2">
          <label htmlFor="cancel-reason" className="text-xs font-semibold text-foreground block">
            {t("cancelReasonPlaceholder")}
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder={t("cancelReasonPlaceholder")}
            disabled={isSubmitting}
            className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
          />
          <div className="flex justify-between items-center text-[11px] text-muted-foreground">
            {errorMsg ? (
              <span className="text-destructive font-medium">{errorMsg}</span>
            ) : (
              <span>{t("minCharNotice")}</span>
            )}
            <span
              className={
                trimmedReason.length > 500
                  ? "text-destructive font-bold"
                  : trimmedReason.length >= 10
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              }
            >
              {trimmedReason.length}/500
            </span>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isSubmitting}
            className="rounded-xl text-xs h-9 px-4"
          >
            {t("back")}
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleCancel}
            disabled={!isValid || isSubmitting}
            variant="destructive"
            className="rounded-xl text-xs font-semibold h-9 px-4 gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t("cancelling")}</span>
              </>
            ) : (
              <span>{t("confirmCancel")}</span>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
