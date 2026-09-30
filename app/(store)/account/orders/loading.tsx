import React from "react";

export default function OrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-44 bg-muted rounded-xl" />
        <div className="h-4 w-64 bg-muted/60 rounded-lg" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-border bg-card p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-5 w-24 bg-muted/70 rounded" />
            </div>
            <div className="h-16 w-full bg-muted/40 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
