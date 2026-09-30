"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Account page error:", error);
  }, [error]);

  return (
    <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-heading font-bold text-lg text-foreground">
          Unable to load account information
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          {error.message || "An unexpected error occurred while loading this page. Please try again."}
        </p>
      </div>
      <div>
        <Button
          onClick={reset}
          variant="outline"
          className="rounded-xl border-border hover:bg-card text-xs font-semibold gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </Button>
      </div>
    </div>
  );
}
