"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          The Kaaravan Encountered a Roadblock
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          We encountered an unexpected issue while loading this marketplace view. Please try reloading or returning home.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} className="rounded-xl bg-primary text-primary-foreground gap-2">
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </Button>
        <Link href="/">
          <Button variant="outline" className="rounded-xl gap-2">
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
