/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/format/currency";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  Copy,
  Check,
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface BankTransferProofUploadProps {
  orderId: string;
  orderNumber: string;
  totalPkr?: number;
  totalMinor?: number;
  guestEmail?: string | null;
  initialProof?: {
    id: string;
    status: string;
    filePath: string;
    createdAt: string;
  } | null;
}

export function BankTransferProofUpload({
  orderId,
  orderNumber,
  totalPkr,
  totalMinor,
  guestEmail,
  initialProof,
}: BankTransferProofUploadProps) {
  const t = useTranslations("orders");
  const [proof, setProof] = useState(initialProof);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const bankDetails = {
    bankName: "Meezan Bank Limited",
    accountTitle: "Kaaravan Marketplace (Pvt) Ltd",
    iban: "PK36MEZN0001234567890123",
    reference: orderNumber,
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      return;
    }

    const selectedFile = e.target.files[0];
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMsg(t("invalidFileType"));
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg(t("fileTooLarge"));
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmitProof = async () => {
    if (!file) {
      setErrorMsg("Please select a valid payment slip image or PDF");
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userFolder = user?.id || "guest";
      const fileExt = file.name.split(".").pop() || "jpg";
      const cleanPath = `${userFolder}/${orderId}-${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage private bucket
      const { error: uploadErr } = await supabase.storage
        .from("payment-proofs")
        .upload(cleanPath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(uploadErr.message || "Failed to upload file to storage");
      }

      // Submit metadata to platform API
      const res = await fetch(`/api/v1/orders/${orderId}/bank-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: cleanPath,
          guestEmail: guestEmail ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit bank transfer proof");
      }

      setProof({
        id: data.proofId,
        status: "pending",
        filePath: cleanPath,
        createdAt: new Date().toISOString(),
      });
      setSuccessMsg(t("proofUploadSuccess"));
      setFile(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Proof upload failed";
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden">
      <CardHeader className="border-b border-border bg-muted/20 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-heading font-bold text-foreground">
                {t("bankTransferInstructions")}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {t("bankTransferNotice")}
              </CardDescription>
            </div>
          </div>
          <Badge variant="accent" className="font-heading font-bold text-xs">
            {formatPkr(totalPkr ?? totalMinor ?? 0)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Bank Account Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-muted/30 border border-border">
            <span className="text-muted-foreground block text-[11px] mb-0.5">
              {t("bankNameLabel")}
            </span>
            <span className="font-semibold text-foreground">{bankDetails.bankName}</span>
          </div>

          <div className="p-3 rounded-2xl bg-muted/30 border border-border">
            <span className="text-muted-foreground block text-[11px] mb-0.5">
              {t("accountTitleLabel")}
            </span>
            <span className="font-semibold text-foreground">
              {bankDetails.accountTitle}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
            <div>
              <span className="text-muted-foreground block text-[11px] mb-0.5">
                {t("ibanLabel")}
              </span>
              <span className="font-mono font-bold text-primary">
                {bankDetails.iban}
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-lg"
              onClick={() => handleCopy(bankDetails.iban, "iban")}
            >
              {copiedField === "iban" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </Button>
          </div>

          <div className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
            <div>
              <span className="text-muted-foreground block text-[11px] mb-0.5">
                {t("referenceLabel")}
              </span>
              <span className="font-mono font-bold text-foreground">
                {bankDetails.reference}
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-lg"
              onClick={() => handleCopy(bankDetails.reference, "ref")}
            >
              {copiedField === "ref" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Existing Proof Status Banner */}
        {proof && (
          <div className="space-y-2">
            {proof.status === "pending" && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-3">
                <Clock className="w-5 h-5 shrink-0" />
                <span>{t("proofUnderReview")}</span>
              </div>
            )}
            {proof.status === "approved" && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{t("proofApproved")}</span>
              </div>
            )}
            {proof.status === "rejected" && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{t("proofRejected")}</span>
              </div>
            )}
          </div>
        )}

        {/* Upload Form: Shown if no proof yet or if previously rejected */}
        {(!proof || proof.status === "rejected") && (
          <div className="space-y-4 pt-2 border-t border-border">
            <div>
              <h3 className="font-heading font-bold text-sm text-foreground">
                {t("uploadSlipTitle")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("uploadSlipDesc")}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/30 cursor-pointer transition-colors p-4 text-center">
                <UploadCloud className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <span className="text-xs font-semibold text-foreground">
                  {file ? file.name : t("chooseFiles")}
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  PNG, JPG, WebP, or PDF (up to 5MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {file && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={uploading}
                    onClick={handleSubmitProof}
                    className="rounded-xl bg-primary text-primary-foreground text-xs font-semibold h-8"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin me-1.5" />
                        <span>{t("submittingProof")}</span>
                      </>
                    ) : (
                      <span>{t("submitProof")}</span>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
