import React from "react";

export default function WishlistLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-44 bg-muted rounded-xl" />
        <div className="h-4 w-64 bg-muted/60 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-border bg-card p-4 space-y-3"
          >
            <div className="aspect-square w-full bg-muted/50 rounded-2xl" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-5 w-1/3 bg-muted rounded" />
            <div className="h-9 w-full bg-muted/70 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
