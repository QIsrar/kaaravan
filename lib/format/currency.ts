/**
 * Copyright (c) 2026 One Tech and AI. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 */

/**
 * Formats integer whole Pakistani Rupees (PKR) into formatted string.
 * Example: 3500 -> "PKR 3,500"
 */
export function formatPkr(amountPkr: number | bigint | null | undefined): string {
  if (amountPkr === null || amountPkr === undefined) return "PKR 0";
  const num = typeof amountPkr === "bigint" ? Number(amountPkr) : amountPkr;
  return `PKR ${Math.round(num).toLocaleString("en-PK")}`;
}

// Backwards-compatible alias for formatPkr
export const formatPaisa = formatPkr;

/**
 * Calculates discount percentage from original compare-at and current price in PKR.
 */
export function calculateDiscountPercent(
  pricePkr: number | bigint,
  compareAtPkr: number | bigint | null | undefined
): number | null {
  if (!compareAtPkr) return null;
  const p = Number(pricePkr);
  const c = Number(compareAtPkr);
  if (c <= p || c <= 0) return null;
  return Math.round(((c - p) / c) * 100);
}

/**
 * Parses a PKR string input into a whole PKR integer.
 * Strictly accepts integer PKR strings.
 */
export function parseRupeesToPkr(amount: string): number {
  if (!amount || typeof amount !== "string") throw new Error("Invalid price format");
  const trimmed = amount.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Invalid price format. Whole PKR integers only.");
  }
  return parseInt(trimmed, 10);
}

// Deprecated alias for backwards compatibility
export const parseRupeesToPaisa = parseRupeesToPkr;

export function formatPkrToString(pkr: number): string {
  return Math.round(pkr).toString();
}

export const formatPaisaToRupees = formatPkrToString;
