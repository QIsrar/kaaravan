import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SellerFinancesLoading() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div>
        <div className="h-8 w-48 bg-muted rounded-xl" />
        <div className="h-4 w-72 bg-muted/60 rounded-lg mt-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-2xl border-border">
            <CardHeader>
              <div className="h-4 w-28 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-8 w-32 bg-muted rounded-lg" />
              <div className="h-3 w-40 bg-muted/60 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border">
        <CardContent className="p-6 space-y-4">
          <div className="h-6 w-36 bg-muted rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-border/50">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

