import React from "react";
import { cn } from "@/lib/utils";

interface PatternDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "tilework" | "caravan-route" | "floral-geo";
  accentColor?: string;
}

/**
 * Kaaravan Visual Signature:
 * Subtle geometric patterns inspired by Pakistani truck art and tilework,
 * used sparingly for section dividers and accents without cluttering product imagery.
 */
export function PatternDivider({
  variant = "tilework",
  className,
  ...props
}: PatternDividerProps) {
  return (
    <div
      role="separator"
      className={cn("w-full flex items-center justify-center py-4 overflow-hidden", className)}
      {...props}
    >
      <div className="h-px bg-border flex-1 max-w-xs" />
      <div className="px-4 flex items-center gap-2 text-primary/60">
        {variant === "tilework" && (
          <svg
            width="64"
            height="18"
            viewBox="0 0 64 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary/70"
          >
            {/* Diamond tile motif */}
            <path
              d="M9 1L17 9L9 17L1 9L9 1Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M9 5L13 9L9 13L5 9L9 5Z"
              fill="var(--color-accent, #c86d51)"
              fillOpacity="0.8"
            />
            <circle cx="25" cy="9" r="2.5" fill="var(--color-secondary, #d4a359)" />
            <path
              d="M41 1L49 9L41 17L33 9L41 1Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M41 5L45 9L41 13L37 9L41 5Z"
              fill="var(--color-accent, #c86d51)"
              fillOpacity="0.8"
            />
            <circle cx="57" cy="9" r="2.5" fill="var(--color-secondary, #d4a359)" />
          </svg>
        )}

        {variant === "caravan-route" && (
          <svg
            width="80"
            height="16"
            viewBox="0 0 80 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary/70"
          >
            <path
              d="M0 8H24M32 8H48M56 8H80"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <circle cx="28" cy="8" r="3" fill="var(--color-primary, #115e59)" />
            <circle cx="52" cy="8" r="3" fill="var(--color-accent, #c86d51)" />
          </svg>
        )}

        {variant === "floral-geo" && (
          <svg
            width="72"
            height="20"
            viewBox="0 0 72 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path
              d="M36 2C31 8 31 12 36 18C41 12 41 8 36 2Z"
              fill="var(--color-primary, #115e59)"
            />
            <path
              d="M28 10C32 7 35 7 38 10C35 13 32 13 28 10Z"
              fill="var(--color-accent, #c86d51)"
            />
            <circle cx="16" cy="10" r="2.5" fill="var(--color-secondary, #d4a359)" />
            <circle cx="56" cy="10" r="2.5" fill="var(--color-secondary, #d4a359)" />
          </svg>
        )}
      </div>
      <div className="h-px bg-border flex-1 max-w-xs" />
    </div>
  );
}
