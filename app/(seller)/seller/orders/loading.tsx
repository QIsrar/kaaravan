import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function SellerOrdersLoading() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      <div>
        <div className="h-8 w-48 bg-muted rounded-xl" />
        <div className="h-4 w-72 bg-muted/60 rounded-lg mt-2" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-2xl border border-border/80">
        <div className="h-10 flex-1 bg-muted rounded-xl" />
        <div className="h-10 w-48 bg-muted rounded-xl" />
      </div>

      <Card className="rounded-2xl border-border">
        <CardContent className="p-6 space-y-4">
          <div className="h-6 w-full bg-muted rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border/50">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-6 w-20 bg-muted rounded-full" />
              <div className="h-8 w-20 bg-muted rounded-xl" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

