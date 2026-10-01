"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  RotateCcw,
  Loader2,
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { requestReturnAction } from "@/lib/actions/customer_orders";
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
import { formatPaisa } from "@/lib/format/currency";

interface ReturnItemDialogProps {
  subOrderId: string;
  orderItemId: string;
  productTitle: string;
  sellerName: string;
  itemQuantity: number;
  returnWindowDays: number;
  deliveredDate: string | null;
  existingReturn?: {
    id: string;
    status: string;
    refund_minor: number | string;
    reason: string;
    evidence_paths: string[];
    created_at: string;
  } | null;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function ReturnItemDialog({
  subOrderId,
  orderItemId,
  productTitle,
  sellerName,
  itemQuantity,
  returnWindowDays,
  deliveredDate,
  existingReturn,
}: ReturnItemDialogProps) {
  const t = useTranslations("orders");

  // Calculate return window deadline
  const deliveredTime = deliveredDate ? new Date(deliveredDate).getTime() : Date.now();
  const deadlineDate = new Date(
    deliveredTime + (returnWindowDays || 7) * 24 * 60 * 60 * 1000
  );
  const isWindowClosed = Date.now() > deadlineDate.getTime();
  const formattedDeadline = deadlineDate.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; url?: string; isPdf: boolean; sizeKb: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If a return request already exists, show its status and server-stored refund amount
  if (existingReturn) {
    const isApproved = existingReturn.status === "approved";
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border border-secondary/30 bg-secondary/10 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-primary">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>{t("returnStatus", { status: existingReturn.status })}</span>
        </div>
        <div className="text-muted-foreground text-[11px] font-mono">
          &bull;{" "}
          {isApproved
            ? t("refundAmount", { amount: formatPaisa(Number(existingReturn.refund_minor)) })
            : t("requestedRefund", { amount: formatPaisa(Number(existingReturn.refund_minor)) })}
        </div>
      </div>
    );
  }

  // If window is closed, show the closed date instead of the button
  if (isWindowClosed) {
    return (
      <span className="text-xs text-muted-foreground italic">
        {t("returnWindowClosed", { date: formattedDeadline })}
      </span>
    );
  }

  const trimmedReason = reason.trim();
  const isReasonValid = trimmedReason.length >= 10 && trimmedReason.length <= 500;
  const isQuantityValid = quantity >= 1 && quantity <= itemQuantity;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(t("invalidFileType", { name: file.name }));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("fileTooLarge", { name: file.name }));
        return;
      }
    }

    const updated = [...evidenceFiles, ...newFiles];
    setEvidenceFiles(updated);

    const previews = updated.map((f) => ({
      name: f.name,
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      isPdf: f.type === "application/pdf",
      sizeKb: Math.round(f.size / 1024),
    }));
    setFilePreviews(previews);
  };

  const handleRemoveFile = (index: number) => {
    const updated = evidenceFiles.filter((_, i) => i !== index);
    setEvidenceFiles(updated);

    const previews = updated.map((f) => ({
      name: f.name,
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      isPdf: f.type === "application/pdf",
      sizeKb: Math.round(f.size / 1024),
    }));
    setFilePreviews(previews);
  };

  const handleSubmit = async () => {
    if (!isReasonValid || !isQuantityValid) {
      setErrorMsg(t("returnValidation"));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("subOrderId", subOrderId);
      formData.append("orderItemId", orderItemId);
      formData.append("reason", trimmedReason);
      formData.append("quantity", String(quantity));

      for (const file of evidenceFiles) {
        formData.append("evidenceFiles", file);
      }

      await requestReturnAction(formData);
      toast.success(t("returnSuccess"));
      setOpen(false);
      setReason("");
      setEvidenceFiles([]);
      setFilePreviews([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit return request";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border text-foreground hover:bg-muted text-xs font-semibold gap-1.5 h-8 px-3"
            />
          }
        >
          <RotateCcw className="w-3.5 h-3.5 text-primary" />
          <span>{t("requestReturn")}</span>
        </AlertDialogTrigger>

        <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {t("returnDialogTitle", { product: productTitle })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {t("returnDialogDesc", { seller: sellerName })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-2 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quantity Selector */}
            {itemQuantity > 1 && (
              <div className="space-y-1.5">
                <label htmlFor="return-quantity" className="font-semibold text-foreground block">
                  {t("returnQuantity")} (Max: {itemQuantity})
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id="return-quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    disabled={isSubmitting}
                    className="rounded-xl border border-border bg-background p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  >
                    {Array.from({ length: itemQuantity }, (_, i) => i + 1).map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted-foreground text-[11px]">
                    {t("unitsToReturn")}
                  </span>
                </div>
              </div>
            )}

            {/* Return Reason */}
            <div className="space-y-1.5">
              <label htmlFor="return-reason" className="font-semibold text-foreground block">
                {t("returnReason")}
              </label>
              <textarea
                id="return-reason"
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={t("returnReasonPlaceholder")}
                disabled={isSubmitting}
                className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
              />
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>{t("minCharNotice")}</span>
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

            {/* Evidence Photos Upload */}
            <div className="space-y-2">
              <label className="font-semibold text-foreground block">
                {t("evidenceFiles")}
              </label>
              <div className="p-4 rounded-2xl border border-dashed border-border bg-muted/20 text-center hover:bg-muted/30 transition-colors relative">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title={t("uploadEvidenceTitle")}
                />
                <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                  <Upload className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground text-xs">
                    {t("chooseFiles")}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {t("evidenceHelp")}
                  </span>
                </div>
              </div>

              {/* Previews */}
              {filePreviews.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    {t("selectedFiles", { count: filePreviews.length })}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {filePreviews.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl border border-border bg-card p-2 flex items-center gap-2 overflow-hidden text-[11px]"
                      >
                        {file.isPdf ? (
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        ) : (
                          <div
                            className="w-8 h-8 rounded-lg bg-cover bg-center shrink-0 border border-border"
                            style={{ backgroundImage: `url(${file.url})` }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">
                            {file.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {file.sizeKb} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          disabled={isSubmitting}
                          className="p-1 text-muted-foreground hover:text-destructive shrink-0"
                          aria-label="Remove attached file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Note on Refund Amount Calculation */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground">
              {t("refundCalculationNotice")}
            </div>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={isSubmitting}
              className="rounded-xl text-xs h-9 px-4"
            >
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isReasonValid || !isQuantityValid || isSubmitting}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-9 px-4 gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t("submittingReturn")}</span>
                </>
              ) : (
                <span>{t("submitReturn")}</span>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <span className="text-[11px] text-muted-foreground">
        {t("returnDeadline", { date: formattedDeadline })}
      </span>
    </div>
  );
}
