import React from "react";

export default function AddressesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-muted rounded-xl" />
          <div className="h-4 w-64 bg-muted/60 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-muted rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-border bg-card p-6 space-y-3"
          >
            <div className="h-5 w-36 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted/60 rounded" />
            <div className="h-12 w-full bg-muted/30 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
