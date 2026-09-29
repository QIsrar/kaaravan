"use client";

import { Image } from "@/components/ui/image";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { formatPaisa } from "@/lib/format/currency";
import { Button } from "@/components/ui/button";

interface AddedToCartToastProps {
  toastId: string | number;
  image: string;
  title: string;
  variantLabel: string;
  quantity: number;
  priceMinor: number;
}

function AddedToCartToastContent({
  toastId,
  image,
  title,
  variantLabel,
  quantity,
  priceMinor,
}: AddedToCartToastProps) {
  const t = useTranslations("store");

  return (
    <div className="flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-muted border border-border">
        <Image src={image} alt={title} fill sizes="56px" className="object-cover" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t("added")}</p>
        <p className="text-sm font-semibold text-foreground line-clamp-1">{title}</p>
        <p className="text-[11px] text-muted-foreground line-clamp-1">
          {variantLabel} · {t("quantity")}: {quantity}
        </p>
        <p className="text-xs font-mono font-semibold text-foreground">
          {formatPaisa(priceMinor * quantity)}
        </p>

        <div className="flex items-center gap-2 pt-1.5">
          <Link href="/cart" onClick={() => toast.dismiss(toastId)}>
            <Button size="xs" variant="outline" className="rounded-lg text-[11px]">
              {t("viewKart")}
            </Button>
          </Link>
          <Link href="/checkout" onClick={() => toast.dismiss(toastId)}>
            <Button
              size="xs"
              className="rounded-lg text-[11px] bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {t("proceedToCheckout")}
            </Button>
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={() => toast.dismiss(toastId)}
        aria-label={t("close")}
        className="p-1 -m-1 text-muted-foreground hover:text-foreground shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function showAddedToCartToast(props: Omit<AddedToCartToastProps, "toastId">) {
  toast.custom((id) => <AddedToCartToastContent toastId={id} {...props} />, {
    duration: 5000,
  });
}
