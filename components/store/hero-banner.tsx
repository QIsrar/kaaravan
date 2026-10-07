"use client";

import React, { useState, useEffect } from "react";
import { Image } from "@/components/ui/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export interface BannerItem {
  id: string;
  title: string | null;
  subtitle?: string | null;
  tag?: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

interface HeroBannerProps {
  banners: BannerItem[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const t = useTranslations("store");
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
    <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] max-h-[480px] rounded-3xl overflow-hidden shadow-md border border-border group bg-background isolate">
      <Link href={current.linkUrl || "#"} className="block w-full h-full relative">
        <div className="hero-media absolute inset-0">
          <Image
            src={current.imageUrl}
            alt={current.title || "Kaaravan Banner"}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center transition-opacity duration-700"
          />
        </div>

        {/* Gradient overlay from the start side (background color at ~75% opacity fading to transparent by ~55% width) behind the banner text, RTL-aware */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none hero-gradient-overlay"
        />

        {/* Banner text content */}
        {current.title && (
          <div className="absolute inset-0 flex flex-col justify-center ps-8 sm:ps-14 md:ps-20 pe-6 pointer-events-none">
            <div className="max-w-[75%] sm:max-w-md md:max-w-lg lg:max-w-xl space-y-1.5 sm:space-y-3 pointer-events-auto text-start">
              {current.tag && (
                <span className="inline-flex items-center text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent/90 text-accent-foreground backdrop-blur-xs shadow-xs w-fit">
                  {current.tag}
                </span>
              )}
              <h2 className="font-heading text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                {current.title}
              </h2>
              {current.subtitle && (
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground line-clamp-2 font-medium">
                  {current.subtitle}
                </p>
              )}
              <div className="pt-1 hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary group-hover:underline">
                <span>{t("discoverNow")}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </div>
            </div>
          </div>
        )}
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
