import React from "react";

export default function ReviewsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-44 bg-muted rounded-xl" />
        <div className="h-4 w-64 bg-muted/60 rounded-lg" />
      </div>

      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-border bg-card p-6 space-y-3"
          >
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-muted/50 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-48 bg-muted rounded" />
                <div className="h-4 w-28 bg-muted/60 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
