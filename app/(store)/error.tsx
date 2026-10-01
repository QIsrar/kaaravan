"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tStore = useTranslations("store");
  const tCommon = useTranslations("common");

  useEffect(() => {
    console.error("Storefront Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 max-w-md">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-foreground">
          {tStore("errorRoadblockTitle")}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {tStore("errorRoadblockDesc")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} className="rounded-xl bg-primary text-primary-foreground gap-2">
          <RotateCcw className="w-4 h-4" />
          <span>{tCommon("tryAgain")}</span>
        </Button>
        <Link href="/">
          <Button variant="outline" className="rounded-xl gap-2">
            <Home className="w-4 h-4" />
            <span>{tCommon("returnHome")}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
