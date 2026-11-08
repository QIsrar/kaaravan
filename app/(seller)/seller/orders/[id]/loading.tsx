import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SellerOrderDetailsLoading() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-4 w-28 bg-muted rounded mb-2" />
          <div className="h-8 w-60 bg-muted rounded-xl" />
          <div className="h-4 w-40 bg-muted/60 rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-muted rounded-xl" />
          <div className="h-10 w-32 bg-muted rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border">
            <CardHeader>
              <div className="h-5 w-32 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 items-center py-2 border-b border-border/50">
                  <div className="w-16 h-16 bg-muted rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 bg-muted rounded" />
                    <div className="h-3 w-32 bg-muted/60 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border">
            <CardHeader>
              <div className="h-5 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-full bg-muted/60 rounded" />
              <div className="h-4 w-2/3 bg-muted/60 rounded" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <div className="h-5 w-28 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="flex justify-between border-t pt-2">
                <div className="h-5 w-24 bg-muted rounded" />
                <div className="h-5 w-20 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

