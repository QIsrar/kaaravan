"use client";

import React, { useState, useEffect } from "react";
import { Image } from "@/components/ui/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface BannerItem {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

interface HeroBannerProps {
  banners: BannerItem[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  const current = banners[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] max-h-[480px] rounded-3xl overflow-hidden shadow-md border border-border group bg-muted">
      <Link href={current.linkUrl || "#"} className="block w-full h-full relative">
        <Image
          src={current.imageUrl}
          alt={current.title || "Kaaravan Banner"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transition-opacity duration-700"
        />
      </Link>

      {/* Prev / Next controls */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
            aria-label="Next Banner"
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-8 bg-secondary"
                    : "w-2 bg-background/60 hover:bg-background/90"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
