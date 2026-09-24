"use client";

import React from "react";
import { Check, Package, Sparkles, Truck, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { JourneyStop } from "@/lib/couriers/types";

interface JourneyTrackerProps {
  currentStop: JourneyStop;
  className?: string;
  orderNumber?: string;
  estimatedArrival?: string;
  onStopChange?: (stop: JourneyStop) => void;
}

const STOPS: { key: JourneyStop; icon: React.ElementType }[] = [
  { key: "placed", icon: Sparkles },
  { key: "packed", icon: Package },
  { key: "on_the_way", icon: Truck },
  { key: "arrived", icon: MapPin },
];

/**
 * Kaaravan Journey-Style Order Tracker:
 * Represents the order journey along waypoint milestones (Placed -> Packed -> On the way -> Arrived).
 * Incorporates Direction 1's warm golden glowing waypoint nodes on solid surfaces.
 */
export function JourneyTracker({
  currentStop,
  className,
  orderNumber = "KV-98241",
  estimatedArrival = "In 2 days",
  onStopChange,
}: JourneyTrackerProps) {
  const t = useTranslations("journey");
  const stopIndex = STOPS.findIndex((s) => s.key === currentStop);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4 mb-6">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            The Caravan Trail
          </span>
          <h4 className="text-base font-semibold text-primary flex items-center gap-2">
            <span>{t("statusMessage")}</span>
            <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse" />
          </h4>
        </div>
        <div className="text-xs sm:text-right">
          <span className="block font-mono font-medium text-foreground">
            Order #{orderNumber}
          </span>
          <span className="text-muted-foreground">Est. Arrival: {estimatedArrival}</span>
        </div>
      </div>

      {/* Visual Journey Route */}
      <div className="relative my-6 px-2 sm:px-6">
        {/* Connector Trail Line */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-muted rounded-full -translate-y-1/2 z-0 hidden sm:block">
          <div
            className="h-full bg-primary transition-all duration-700 rounded-full"
            style={{
              width: `${(Math.max(0, stopIndex) / (STOPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Waypoints along the Route */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative z-10">
          {STOPS.map((stop, index) => {
            const isCompleted = index < stopIndex;
            const isCurrent = index === stopIndex;
            const Icon = stop.icon;

            return (
              <button
                key={stop.key}
                type="button"
                onClick={() => onStopChange?.(stop.key)}
                className={cn(
                  "group flex sm:flex-col items-center gap-3 text-left sm:text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-1",
                  onStopChange ? "cursor-pointer" : "cursor-default"
                )}
              >
                {/* Node Milestone with Warm Golden Glowing Waypoint */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 relative",
                    isCompleted &&
                      "bg-primary text-primary-foreground border-primary shadow-xs",
                    isCurrent &&
                      "bg-secondary text-secondary-foreground border-secondary ring-4 ring-secondary/35 shadow-[0_0_18px_rgba(217,155,38,0.45)] scale-110",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-card text-muted-foreground border-border hover:border-secondary/60"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <>
                      <Icon className="w-5 h-5 stroke-[2.2] animate-bounce" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full ring-2 ring-card animate-ping" />
                    </>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Milestone Details */}
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isCurrent
                        ? "text-primary font-bold"
                        : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {t(stop.key)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isCurrent ? (
                      <span className="text-secondary font-medium">In Transit</span>
                    ) : isCompleted ? (
                      "Completed"
                    ) : (
                      "Upcoming"
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
