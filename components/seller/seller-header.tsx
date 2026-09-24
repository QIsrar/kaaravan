import Link from "next/link";
import { BRAND_CONFIG } from "@/config/brand";
import { Store } from "lucide-react";

interface SellerHeaderProps {
  sellerName?: string;
}

export function SellerHeader({ sellerName = "Merchant Partner" }: SellerHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-heading font-bold text-lg text-primary">
          {BRAND_CONFIG.name}
        </Link>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          Seller Portal
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-medium hidden sm:inline">{sellerName}</span>
        </div>
      </div>
    </header>
  );
}
