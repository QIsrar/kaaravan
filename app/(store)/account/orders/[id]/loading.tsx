import React from "react";

export default function OrderDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-muted rounded-xl" />
          <div className="h-4 w-40 bg-muted/60 rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-muted rounded-xl" />
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
        <div className="h-24 w-full bg-muted/40 rounded-2xl" />
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
        <div className="h-6 w-48 bg-muted rounded-lg" />
        <div className="h-32 w-full bg-muted/30 rounded-2xl" />
      </div>
    </div>
  );
}
