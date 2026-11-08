import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function NewProductLoading() {
  return (
    <div className="space-y-6 max-w-4xl animate-pulse">
      <div>
        <div className="h-8 w-48 bg-muted rounded-xl" />
        <div className="h-4 w-72 bg-muted/60 rounded-lg mt-2" />
      </div>

      <Card className="rounded-2xl border-border">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-24 w-full bg-muted rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

