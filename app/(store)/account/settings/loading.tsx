import React from "react";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-44 bg-muted rounded-xl" />
        <div className="h-4 w-64 bg-muted/60 rounded-lg" />
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <div className="h-6 w-36 bg-muted rounded" />
          <div className="space-y-3">
            <div className="h-10 w-full bg-muted/40 rounded-xl" />
            <div className="h-10 w-full bg-muted/40 rounded-xl" />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <div className="h-6 w-36 bg-muted rounded" />
          <div className="space-y-3">
            <div className="h-10 w-full bg-muted/40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
