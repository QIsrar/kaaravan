import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SellerDashboardLoading() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      <div>
        <div className="h-8 w-64 bg-muted rounded-xl" />
        <div className="h-4 w-96 bg-muted/60 rounded-lg mt-2" />
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-2xl border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="w-4 h-4 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-8 w-20 bg-muted rounded-lg" />
              <div className="h-3 w-32 bg-muted/60 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Performance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border lg:col-span-1">
          <CardHeader>
            <div className="h-4 w-36 bg-muted rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center border-b pb-2">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

