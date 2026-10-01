"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle } from "lucide-react";
import { BRAND_CONFIG } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PatternDivider } from "@/components/store/pattern-divider";
import { createClient } from "@/lib/supabase/client";
import { mergeGuestCartAction } from "@/lib/actions/cart";
import { getSafeRedirect } from "@/lib/utils";

function LoginForm() {
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = getSafeRedirect(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || "Invalid credentials. Please verify and try again.");
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        // Merge any guest cart session into the authenticated user's cart
        try {
          await mergeGuestCartAction();
        } catch {
          // Non-critical if merge fails
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        const destination =
          profileData?.role === "seller"
            ? "/seller"
            : profileData?.role === "superadmin"
              ? "/admin"
              : redirectParam;

        router.push(destination);
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-border/80 mb-6 bg-card">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-sm">
          K
        </div>
        <CardTitle className="font-heading text-2xl font-bold text-foreground">
          Sign In to {BRAND_CONFIG.name}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Enter your credentials to join your Kaaravan
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              Email Address
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tAuth("emailPlaceholder")}
              className="rounded-xl border-border"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
            <span>{isLoading ? "Signing in..." : "Sign In"}</span>
          </Button>
        </form>

        <PatternDivider variant="caravan-route" className="py-2" />

        <div className="text-xs text-center text-muted-foreground">
          Looking for seller access?{" "}
          <Link href="/sell" className="text-primary font-semibold hover:underline">
            Become a Seller
          </Link>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border/60 pt-4 text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`}
          className="text-accent font-semibold ms-1 hover:underline"
        >
          Create an Account
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  const tLegal = useTranslations("legal");
  const tAuth = useTranslations("auth");

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
      <Suspense fallback={<div className="text-sm text-muted-foreground">{tAuth("loadingLogin")}</div>}>
        <LoginForm />
      </Suspense>
      <div className="max-w-md text-center text-xs text-muted-foreground px-4">
        {tLegal("portalCopyright")}
      </div>
    </div>
  );
}
