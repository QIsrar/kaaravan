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

export function parseRupeesToPaisa(amount: string): number {
  if (!amount || typeof amount !== "string") throw new Error("Invalid price format");
  const trimmed = amount.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("Invalid price format. Max 2 decimal places allowed.");
  }
  const parts = trimmed.split(".");
  const rupees = parseInt(parts[0], 10);
  let paisa = 0;
  if (parts.length > 1) {
    let fractionalStr = parts[1];
    if (fractionalStr.length === 1) fractionalStr += "0";
    paisa = parseInt(fractionalStr, 10);
  }
  return rupees * 100 + paisa;
}

export function formatPaisaToRupees(paisa: number): string {
  const rupees = Math.floor(paisa / 100);
  const fractional = paisa % 100;
  if (fractional === 0) return rupees.toString();
  return `${rupees}.${fractional.toString().padStart(2, "0")}`;
}
