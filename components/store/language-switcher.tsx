"use client";

import React from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { setLocaleAction } from "@/lib/actions/locale";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const currentLocale = useLocale();

  const handleSwitch = async (newLocale: "en" | "ur") => {
    if (newLocale === currentLocale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    try {
      await setLocaleAction(newLocale);
    } catch {
      // Cookie was already set on document.cookie
    }
    window.location.reload();
  };

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/50 p-0.5 text-xs font-medium shadow-2xs",
        className
      )}
    >
      <button
        type="button"
        onClick={() => handleSwitch("en")}
        aria-pressed={currentLocale === "en"}
        className={cn(
          "px-2.5 py-1 rounded-full transition-all text-xs font-semibold focus-visible:outline-2 focus-visible:outline-ring",
          currentLocale === "en"
            ? "bg-primary text-primary-foreground shadow-2xs font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-background/60"
        )}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => handleSwitch("ur")}
        aria-pressed={currentLocale === "ur"}
        className={cn(
          "px-2.5 py-1 rounded-full transition-all text-xs font-semibold font-urdu focus-visible:outline-2 focus-visible:outline-ring leading-normal",
          currentLocale === "ur"
            ? "bg-primary text-primary-foreground shadow-2xs font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-background/60"
        )}
      >
        اردو
      </button>
    </div>
  );
}
