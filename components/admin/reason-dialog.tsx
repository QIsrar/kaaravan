"use client";

import React, { useState, useTransition } from "react";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ReasonDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "destructive" | "default";
  trigger: React.ReactNode;
  onConfirm: (reason: string) => Promise<void>;
  requireReason?: boolean;
}

export function ReasonDialog({
  title,
  description,
  confirmLabel,
  variant = "destructive",
  trigger,
  onConfirm,
  requireReason = true,
}: ReasonDialogProps) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError("Please provide a reason");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await onConfirm(reason.trim());
        setOpen(false);
        setReason("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger as React.ReactElement} />
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-lg font-bold">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-3">
          <Label htmlFor="action-reason" className="text-xs font-semibold">
            {t("reasonLabel")} {requireReason ? "*" : ""}
          </Label>
          <Textarea
            id="action-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t("reasonPlaceholder")}
            className="text-xs min-h-[80px]"
            disabled={isPending}
          />
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        </div>

        <AlertDialogFooter className="flex items-center justify-end gap-2 pt-2">
          <AlertDialogCancel disabled={isPending} className="text-xs h-9">
            Cancel
          </AlertDialogCancel>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={isPending || (requireReason && !reason.trim())}
            className="text-xs h-9 min-w-[90px]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin me-1.5" />
                {t("submitting")}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

