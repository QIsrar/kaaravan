"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, Loader2, KeyRound, AlertCircle, Copy, Check } from "lucide-react";

export function MfaEnrollmentForm() {
  const t = useTranslations("admin");
  const router = useRouter();
  const supabase = createClient();

  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function startEnrollment() {
      try {
        setLoading(true);
        setError(null);

        // Check if user already has a verified factor
        const { data: factorData } = await supabase.auth.mfa.listFactors();
        const hasVerified = (factorData?.totp || []).length > 0;
        if (hasVerified) {
          router.replace("/admin/mfa");
          return;
        }

        // Clean up any unverified leftover factors
        const unverifiedFactors = (factorData?.all || []).filter(
          (f) => f.factor_type === "totp" && f.status === "unverified"
        );
        for (const uf of unverifiedFactors) {
          await supabase.auth.mfa.unenroll({ factorId: uf.id });
        }

        // Enroll new TOTP factor
        const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Kaaravan Admin",
        });

        if (enrollErr || !data) {
          throw new Error(enrollErr?.message || "Failed to initialize 2FA enrollment");
        }

        if (isMounted) {
          setFactorId(data.id);
          setQrCodeSvg(data.totp.qr_code);
          setSecret(data.totp.secret);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to prepare 2FA enrollment");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    startEnrollment();

    return () => {
      isMounted = false;
    };
  }, [supabase, router]);

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;

    const trimmedCode = verifyCode.replace(/\D/g, "");
    if (trimmedCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: trimmedCode,
      });

      if (verifyErr) {
        setError(verifyErr.message || "Invalid verification code. Please check your authenticator app.");
        return;
      }

      // Success: session upgraded to aal2, navigate into admin dashboard
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Setting up two-factor authentication...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-border">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl font-heading font-bold text-foreground">
          {t("enrollMfaTitle")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("enrollMfaDesc")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2 text-center">
          <p className="text-xs font-medium text-foreground">
            {t("scanQrCode")}
          </p>
          {qrCodeSvg && (
            <div className="flex justify-center p-3 bg-white rounded-2xl border border-border shadow-xs w-fit mx-auto">
              {/* qr_code from supabase is an SVG string or data uri */}
              {qrCodeSvg.startsWith("data:") ? (
                <Image
                  src={qrCodeSvg}
                  alt="MFA QR Code"
                  width={192}
                  height={192}
                  unoptimized
                  className="w-48 h-48"
                />
              ) : (
                <div
                  className="w-48 h-48 [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                />
              )}
            </div>
          )}
        </div>

        {secret && (
          <div className="space-y-1.5 bg-muted/40 p-3 rounded-xl border border-border text-xs">
            <p className="text-[11px] text-muted-foreground font-medium">{t("manualSecret")}</p>
            <div className="flex items-center justify-between font-mono font-bold text-foreground tracking-wider bg-card p-1.5 rounded-lg border">
              <span>{secret}</span>
              <button
                type="button"
                onClick={handleCopySecret}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
                title="Copy secret"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="mfa-code" className="text-xs font-semibold">
              2. Enter the 6-digit code from your app:
            </Label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="ps-9 font-mono text-center text-lg tracking-widest font-bold h-11"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting || verifyCode.length !== 6} className="w-full h-10">
            {submitting ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              t("verifyAndContinue")
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="pt-0 justify-center">
        <p className="text-[11px] text-muted-foreground text-center">
          Kaaravan Platform Governance Security Protection
        </p>
      </CardFooter>
    </Card>
  );
}

