"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, Loader2, KeyRound, AlertCircle } from "lucide-react";

export function MfaVerifyForm() {
  const t = useTranslations("admin");
  const router = useRouter();
  const supabase = createClient();

  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkFactors() {
      try {
        setLoading(true);
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.currentLevel === "aal2") {
          router.replace("/admin");
          return;
        }

        const { data: factorData, error: factorErr } = await supabase.auth.mfa.listFactors();
        if (factorErr) throw factorErr;

        const verifiedFactor = (factorData?.totp || [])[0];
        if (!verifiedFactor) {
          router.replace("/admin/mfa/enroll");
          return;
        }

        if (isMounted) {
          setFactorId(verifiedFactor.id);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load authentication factor");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkFactors();

    return () => {
      isMounted = false;
    };
  }, [supabase, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;

    const trimmedCode = verifyCode.replace(/\D/g, "");
    if (trimmedCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Challenge and verify with the verified factor
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeErr || !challengeData) {
        throw new Error(challengeErr?.message || "Failed to create authentication challenge");
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: trimmedCode,
      });

      if (verifyErr) {
        setError(verifyErr.message || "Invalid 2FA code. Please verify the code in your authenticator app.");
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
          <p className="text-sm text-muted-foreground">Checking authentication state...</p>
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
          {t("twoFactorTitle")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("twoFactorDesc")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mfa-verify-code" className="text-xs font-semibold">
              {t("securityCode")}:
            </Label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mfa-verify-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="ps-9 font-mono text-center text-xl tracking-widest font-bold h-12"
                required
                autoFocus
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting || verifyCode.length !== 6} className="w-full h-11 text-sm font-semibold">
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
          Kaaravan Administrative Session Protection (aal2)
        </p>
      </CardFooter>
    </Card>
  );
}

