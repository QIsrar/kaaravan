import React from "react";
import { PatternDivider } from "@/components/store/pattern-divider";

export default function AccountLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded-xl" />
        <div className="h-4 w-72 bg-muted/60 rounded-lg" />
      </div>

      <PatternDivider variant="tilework" className="py-2 opacity-50" />

      <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-36 bg-muted rounded-lg" />
        <div className="h-20 w-full bg-muted/40 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-32 rounded-3xl border border-border bg-card p-4 space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted/70 rounded-xl" />
        </div>
        <div className="h-32 rounded-3xl border border-border bg-card p-4 space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted/70 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
