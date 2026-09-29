/**
 * Copyright (c) 2026 One Tech and AI. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 */

/**
 * Formats integer paisa (minor currency unit) into formatted Pakistani Rupee string.
 * Example: 350000 paisa -> "PKR 3,500"
 */
export function formatPaisa(amountMinor: number | bigint | null | undefined): string {
  if (amountMinor === null || amountMinor === undefined) return "PKR 0";
  const num = typeof amountMinor === "bigint" ? Number(amountMinor) : amountMinor;
  const rupees = Math.round(num / 100);
  return `PKR ${rupees.toLocaleString("en-PK")}`;
}

/**
 * Calculates discount percentage from original compare-at and current price.
 */
export function calculateDiscountPercent(
  priceMinor: number | bigint,
  compareAtMinor: number | bigint | null | undefined
): number | null {
  if (!compareAtMinor) return null;
  const p = Number(priceMinor);
  const c = Number(compareAtMinor);
  if (c <= p) return null;
  return Math.round(((c - p) / c) * 100);
}
