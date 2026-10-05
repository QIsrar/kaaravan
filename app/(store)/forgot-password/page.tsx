"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PatternDivider } from "@/components/store/pattern-divider";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const tAuth = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=/account/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message || "Failed to initiate password reset. Please verify your email.");
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
      setIsLoading(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md shadow-lg border-border/80 mb-6 bg-card">
        <CardHeader className="text-center pb-2">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-xs flex items-center justify-center overflow-hidden">
          <Image
            src={BRAND_CONFIG.logoPath}
            alt={BRAND_CONFIG.name}
            width={64}
            height={64}
            className="w-full h-full object-contain"
            priority
          />
        </div>
          <CardTitle className="font-heading text-2xl font-bold text-foreground">
            Reset Password
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Recover access to your {BRAND_CONFIG.name} account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="p-4 rounded-2xl bg-secondary/15 border border-secondary/30 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-secondary mx-auto" />
              <h3 className="font-heading font-bold text-sm text-foreground">{tAuth("checkInbox")}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If an account exists with <strong>{email}</strong>, password reset instructions have been dispatched.
              </p>
              <Link href="/login" className="inline-block mt-2">
                <Button variant="outline" size="sm" className="text-xs rounded-xl">
                  {tAuth("backToSignIn")}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter your registered email address below. We will send you a secure link to reset your account password.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Email Address
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tAuth("forgotEmailPlaceholder")}
                  className="rounded-xl border-border"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl mt-2 font-medium flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isLoading ? "Sending Instructions..." : "Send Reset Link"}</span>
              </Button>
            </form>
          )}

          <PatternDivider variant="caravan-route" className="py-2" />
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <Link href="/login" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{tAuth("backToSignIn")}</span>
          </Link>
        </CardFooter>
      </Card>

      <div className="max-w-md text-center text-xs text-muted-foreground px-4">
        © 2026 One Tech and AI. Confidential and Proprietary. All Rights Reserved.
      </div>
    </div>
  );
}
