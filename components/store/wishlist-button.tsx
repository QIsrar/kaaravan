"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  variantId: string;
  className?: string;
  iconClassName?: string;
  showText?: boolean;
}

export function WishlistButton({
  variantId,
  className,
  iconClassName,
  showText = false,
}: WishlistButtonProps) {
  const { isWishlisted, toggleWishlist, isPending } = useWishlist();
  const saved = isWishlisted(variantId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(variantId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "p-2 rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        saved
          ? "text-rose-600 bg-rose-50/90 dark:bg-rose-950/40 hover:scale-110 shadow-2xs"
          : "text-muted-foreground hover:text-rose-600 bg-background/80 hover:bg-background backdrop-blur-xs hover:scale-105 shadow-2xs",
        className
      )}
    >
      <Heart
        className={cn(
          "w-4 h-4 transition-transform duration-200",
          saved ? "fill-current scale-110" : "stroke-[2]",
          iconClassName
        )}
      />
      {showText && (
        <span className="text-xs font-semibold ms-1.5">
          {saved ? "Saved to Wishlist" : "Save to Wishlist"}
        </span>
      )}
    </button>
  );
}
