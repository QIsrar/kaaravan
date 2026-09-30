import React from "react";
import type { Metadata } from "next";
import { TrackOrderView } from "@/components/store/track-order-view";

export const metadata: Metadata = {
  title: "Track Your Order Journey | Kaaravan",
  description:
    "Look up your artisan order and follow its milestones along the Kaaravan trail across Pakistan.",
};

export default function TrackOrderPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <TrackOrderView />
    </div>
  );
}
