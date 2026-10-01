"use client";

import React from "react";
import { Check, Package, Sparkles, Truck, MapPin, XCircle, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { JOURNEY_STOP_MESSAGE_KEYS, type JourneyStop } from "@/lib/couriers/types";

interface JourneyTrackerProps {
  currentStop?: JourneyStop;
  status?: string;
  orderNumber: string;
  className?: string;
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
  currentStop = "placed",
  status,
  className,
  orderNumber,
  estimatedArrival,
  onStopChange,
}: JourneyTrackerProps) {
  const t = useTranslations("journey");

  const isCancelled = status === "cancelled";
  const isReturned = status === "returned";
  const isTerminated = isCancelled || isReturned;
  const isDelivered = status === "delivered" || currentStop === "arrived";

  const rawStopIndex = STOPS.findIndex((s) => s.key === currentStop);
  const activeStopIndex = rawStopIndex >= 0 ? rawStopIndex : 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-sm transition-opacity",
        isTerminated && "opacity-75 bg-muted/20 border-border/80",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4 mb-6">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            {t("theKaaravanTrail")}
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <h4
              className={cn(
                "text-base font-semibold flex items-center gap-2",
                isTerminated
                  ? "text-muted-foreground"
                  : isDelivered
                  ? "text-foreground font-bold"
                  : "text-primary"
              )}
            >
              <span>
                {isCancelled
                  ? t("journeyCancelledMessage")
                  : isReturned
                  ? t("journeyReturnedMessage")
                  : isDelivered
                  ? t("deliveredStatusMessage")
                  : t("statusMessage")}
              </span>
            </h4>
            {isTerminated ? (
              <Badge
                variant="destructive"
                className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 py-0.5 px-2"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isCancelled ? t("cancelled") : t("returned")}</span>
              </Badge>
            ) : isDelivered ? (
              <Badge
                variant="default"
                className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 py-0.5 px-2 bg-primary text-primary-foreground"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t("delivered")}</span>
              </Badge>
            ) : (
              <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse" />
            )}
          </div>
        </div>
        <div className="text-xs sm:text-end">
          <span className="block font-mono font-medium text-foreground">
            Order #{orderNumber}
          </span>
          {estimatedArrival && !isTerminated && (
            <span className="text-muted-foreground">Est. Arrival: {estimatedArrival}</span>
          )}
        </div>
      </div>

      {/* Visual Journey Route */}
      <div className="relative my-6 px-2 sm:px-6">
        {/* Connector Trail Line */}
        <div className="absolute top-6 start-6 end-6 h-1 bg-muted rounded-full -translate-y-1/2 z-0 hidden sm:block">
          <div
            className={cn(
              "h-full transition-all duration-700 rounded-full",
              isTerminated ? "bg-muted-foreground/30" : "bg-primary"
            )}
            style={{
              width: isTerminated
                ? "0%"
                : isDelivered
                ? "100%"
                : `${(Math.max(0, activeStopIndex) / (STOPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Waypoints along the Route */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative z-10">
          {STOPS.map((stop, index) => {
            // When delivered, all 4 stops are completed
            const isCompleted = isDelivered || (!isTerminated && index < activeStopIndex);
            // When terminated (cancelled/returned) or delivered, no stop is "in transit"
            const isCurrent = !isTerminated && !isDelivered && index === activeStopIndex;
            const Icon = stop.icon;

            return (
              <button
                key={stop.key}
                type="button"
                onClick={() => onStopChange?.(stop.key)}
                className={cn(
                  "group flex sm:flex-col items-center gap-3 text-start sm:text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-1",
                  onStopChange && !isTerminated ? "cursor-pointer" : "cursor-default"
                )}
              >
                {/* Node Milestone with Warm Golden Glowing Waypoint */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 relative",
                    isTerminated &&
                      "bg-muted/40 text-muted-foreground border-border",
                    !isTerminated &&
                      isCompleted &&
                      "bg-primary text-primary-foreground border-primary shadow-xs",
                    !isTerminated &&
                      isCurrent &&
                      "bg-secondary text-secondary-foreground border-secondary ring-4 ring-secondary/35 shadow-[0_0_18px_rgba(217,155,38,0.45)] scale-110",
                    !isTerminated &&
                      !isCompleted &&
                      !isCurrent &&
                      "bg-card text-muted-foreground border-border hover:border-secondary/60"
                  )}
                >
                  {isTerminated ? (
                    <Icon className="w-5 h-5 text-muted-foreground/60" />
                  ) : isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <>
                      <Icon className="w-5 h-5 stroke-[2.2] animate-bounce" />
                      <span className="absolute -top-1 -end-1 w-3 h-3 bg-secondary rounded-full ring-2 ring-card animate-ping" />
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
                      isTerminated
                        ? "text-muted-foreground"
                        : isCurrent
                        ? "text-primary font-bold"
                        : isCompleted
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {t(JOURNEY_STOP_MESSAGE_KEYS[stop.key])}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isTerminated ? (
                      <span className="text-muted-foreground/80">
                        {isCancelled ? t("cancelled") : t("returned")}
                      </span>
                    ) : isDelivered ? (
                      index === STOPS.length - 1 ? (
                        <span className="text-primary font-semibold">{t("delivered")}</span>
                      ) : (
                        t("completed")
                      )
                    ) : isCurrent ? (
                      <span className="text-secondary font-medium">{t("inTransit")}</span>
                    ) : isCompleted ? (
                      t("completed")
                    ) : (
                      t("upcoming")
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
