import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function SellerSettingsLoading() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div>
        <div className="h-8 w-48 bg-muted rounded-xl" />
        <div className="h-4 w-72 bg-muted/60 rounded-lg mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted/60 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-20 w-full bg-muted rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border">
            <CardContent className="p-6 space-y-4">
              <div className="h-6 w-40 bg-muted rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-10 bg-muted rounded-xl" />
                <div className="h-10 bg-muted rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-10 bg-muted rounded-xl" />
                <div className="h-10 bg-muted rounded-xl" />
              </div>
              <div className="h-10 bg-muted rounded-xl" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border">
            <CardContent className="p-6 space-y-3">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-4 w-48 bg-muted/60 rounded" />
              <div className="h-4 w-32 bg-muted/60 rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

