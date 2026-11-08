"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isNavigating]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      if (
        href &&
        !targetAttr &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey &&
        !href.startsWith("#") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:") &&
        (href.startsWith("/") || href.startsWith(window.location.origin))
      ) {
        try {
          const url = new URL(href, window.location.origin);
          if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
            setIsNavigating(true);
            setProgress(25);
            const t1 = setTimeout(() => setProgress(65), 150);
            const t2 = setTimeout(() => setProgress(85), 400);
            return () => {
              clearTimeout(t1);
              clearTimeout(t2);
            };
          }
        } catch {
          // invalid url
        }
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] h-0.5 sm:h-1 bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-primary transition-all duration-200 ease-out shadow-sm"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

export function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
