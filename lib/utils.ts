import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Only relative, same-origin paths are accepted (must start with "/" and
 * not "//"), so a crafted `redirect` query param can never send a user off-site.
 */
export function getSafeRedirect(param: string | null, fallback = "/account"): string {
  if (param && param.startsWith("/") && !param.startsWith("//")) {
    return param;
  }
  return fallback;
}

export function formatMinorUnit(minorUnits: number, currency = "PKR", locale = "en-PK"): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  });
  // Minor units are 1/100 of a major unit (paisa/cents)
  return formatter.format(minorUnits / 100);
}
