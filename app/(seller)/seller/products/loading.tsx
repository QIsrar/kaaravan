import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function SellerProductsLoading() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-8 w-48 bg-muted rounded-xl" />
          <div className="h-4 w-72 bg-muted/60 rounded-lg mt-2" />
        </div>
        <div className="h-10 w-36 bg-muted rounded-xl" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-2xl border border-border/80">
        <div className="h-10 flex-1 bg-muted rounded-xl" />
        <div className="h-10 w-48 bg-muted rounded-xl" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-2xl border-border">
            <CardContent className="p-4 sm:p-5 flex gap-4 items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-64 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted/60 rounded" />
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-muted rounded-full" />
                  <div className="h-6 w-24 bg-muted rounded-full" />
                </div>
              </div>
              <div className="h-8 w-24 bg-muted rounded-xl shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

