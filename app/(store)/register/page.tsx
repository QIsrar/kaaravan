"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PatternDivider } from "@/components/store/pattern-divider";
import { createClient } from "@/lib/supabase/client";
import { mergeGuestCartAction } from "@/lib/actions/cart";
import { getSafeRedirect } from "@/lib/utils";

function RegisterForm() {
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = getSafeRedirect(searchParams.get("redirect"));

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage("You must agree to the Terms of Use and Privacy Policy to continue.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim() || undefined,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || "Failed to create account. Please try again.");
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        // Logged in immediately
        try {
          await mergeGuestCartAction();
        } catch {
          // Non-critical
        }
        router.push(redirectParam);
        router.refresh();
      } else {
        // Email confirmation required
        setSuccessMessage("Account created successfully! Please check your email to verify your Kaaravan account.");
        setIsLoading(false);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
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
          Join {BRAND_CONFIG.name}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Create your buyer account to track orders and join the Kaaravan
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div className="p-4 rounded-2xl bg-secondary/15 border border-secondary/30 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-secondary mx-auto" />
            <h3 className="font-heading font-bold text-sm text-foreground">{tAuth("welcomeTitle")}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{successMessage}</p>
            <Button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-2 w-full bg-primary text-primary-foreground text-xs"
            >
              {tAuth("login")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Full Name *
              </label>
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={tAuth("fullNamePlaceholder")}
                className="rounded-xl border-border text-sm"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Email Address *
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tAuth("emailPlaceholder")}
                className="rounded-xl border-border text-sm"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Mobile Number
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03001234567"
                className="rounded-xl border-border text-sm"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Password * (min. 8 characters)
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border-border text-sm pe-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? tCommon("hidePassword") : tCommon("showPassword")}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={isLoading}
                required
                className="mt-0.5 accent-primary"
              />
              <span>
                I agree to the{" "}
                <Link href="/legal/terms" target="_blank" className="text-primary font-semibold hover:underline">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" target="_blank" className="text-primary font-semibold hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <Button
              type="submit"
              disabled={isLoading || !agreedToTerms}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl mt-1 font-medium flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
            </Button>
          </form>
        )}

        <PatternDivider variant="caravan-route" className="py-2" />

        <div className="text-xs text-center text-muted-foreground">
          Looking to sell crafts?{" "}
          <Link href="/sell" className="text-primary font-semibold hover:underline">
            Register as an Artisan Seller
          </Link>
        </div>

      </CardContent>

      <CardFooter className="flex justify-center border-t border-border/60 pt-4 text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
          className="text-accent font-semibold ms-1 hover:underline"
        >
          Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  const tLegal = useTranslations("legal");
  const tAuth = useTranslations("auth");

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
      <Suspense fallback={<div className="text-sm text-muted-foreground">{tAuth("loadingRegister")}</div>}>
        <RegisterForm />
      </Suspense>
      <div className="max-w-md text-center text-xs text-muted-foreground px-4">
        {tLegal("portalCopyright")}
      </div>
    </div>
  );
}
