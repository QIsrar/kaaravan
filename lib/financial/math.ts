/**
 * Copyright (c) 2026 One Tech and AI. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 * 
 * Kaaravan Financial Math & Rules Engine (Phase 8 Remediation)
 * 
 * CRITICAL MONETARY ARCHITECTURE:
 * 1. Money is ALWAYS stored and manipulated in whole Pakistani Rupees (PKR) as integer values (BIGINT in Postgres).
 * 2. Kaaravan does not use paisa as an application or database monetary unit.
 * 3. Commission rates are stored in basis points (rate_bps, where 100 bps = 1.00%, 10,000 bps = 100.00%).
 * 4. Exact integer rounding formula (nearest whole PKR, half-up):
 *    floor((amount_pkr * rate_bps + 5000) / 10000)
 *    Implemented safely using JavaScript BigInt integer division. No floating-point multiplication with Math.round().
 * 5. Commission rate resolution precedence:
 *    seller.commission_rate_bps > category.commission_rate_bps > platform_default (default 500 bps = 5.0%).
 * 6. Ledger balances invariant:
 *    balances = sums (total_balance_pkr = sum of all amount_pkr entries).
 *    available_balance_pkr = sum of amount_pkr where available_at <= current_timestamp.
 *    held_balance_pkr = sum of amount_pkr where available_at > current_timestamp.
 */

export const DEFAULT_PLATFORM_COMMISSION_BPS = 500; // 5.0%

/**
 * Resolves effective commission rate in basis points using strict priority hierarchy:
 * 1. Seller-specific custom rate override
 * 2. Category default rate
 * 3. Platform default (500 bps = 5.0%)
 */
export function resolveCommissionRate(
  sellerRateBps?: number | null,
  categoryRateBps?: number | null,
  platformDefaultBps: number = DEFAULT_PLATFORM_COMMISSION_BPS
): number {
  if (sellerRateBps !== undefined && sellerRateBps !== null && !isNaN(sellerRateBps) && sellerRateBps >= 0) {
    return Math.floor(sellerRateBps);
  }
  if (categoryRateBps !== undefined && categoryRateBps !== null && !isNaN(categoryRateBps) && categoryRateBps >= 0) {
    return Math.floor(categoryRateBps);
  }
  return platformDefaultBps;
}

/**
 * Calculates marketplace commission in integer whole Pakistani Rupees (PKR)
 * using documented nearest-whole-PKR half-up integer arithmetic:
 * floor((amount_pkr * rate_bps + 5000) / 10000)
 * 
 * @param basePkr Subtotal or merchandise value in whole PKR
 * @param rateBps Effective commission rate in basis points
 * @returns Integer commission amount in whole PKR
 */
export function calculateCommissionPkr(
  basePkr: number | bigint,
  rateBps: number | bigint
): number {
  const base = BigInt(basePkr);
  const bps = BigInt(rateBps);
  const zero = BigInt(0);
  if (base <= zero || bps <= zero) return 0;
  return Number((base * bps + BigInt(5000)) / BigInt(10000));
}

// Deprecated alias for backwards compatibility during migration
export const calculateCommissionMinor = calculateCommissionPkr;

export interface LedgerEntryMathItem {
  amountPkr: number | bigint;
  availableAt: string | Date;
}

export interface AggregatedLedgerBalances {
  totalBalancePkr: number;
  availableBalancePkr: number;
  heldBalancePkr: number;
}

/**
 * Aggregates ledger balances adhering to the double-entry rule: "balances = sums".
 * Separates available cleared funds from held funds during the customer return window.
 */
export function aggregateLedgerBalances(
  entries: LedgerEntryMathItem[],
  asOf: Date = new Date()
): AggregatedLedgerBalances {
  const asOfMs = asOf.getTime();
  let totalBalancePkr = 0;
  let availableBalancePkr = 0;
  let heldBalancePkr = 0;

  for (const entry of entries) {
    const amount = typeof entry.amountPkr === "bigint" ? Number(entry.amountPkr) : entry.amountPkr;
    totalBalancePkr += amount;

    const availableTime = entry.availableAt instanceof Date 
      ? entry.availableAt.getTime() 
      : new Date(entry.availableAt).getTime();

    if (availableTime <= asOfMs) {
      availableBalancePkr += amount;
    } else {
      heldBalancePkr += amount;
    }
  }

  return {
    totalBalancePkr,
    availableBalancePkr,
    heldBalancePkr,
  };
}

export interface PartialReturnItemInput {
  unitPricePkr: number | bigint;
  quantityOrdered: number;
  quantityToReturn: number;
  commissionRateBps: number;
}

export interface PartialReturnCalculationResult {
  recalculatedRefundPkr: number;
  commissionReversalPkr: number;
  netSellerDebitPkr: number;
}

/**
 * Recalculates partial return financial allocations server-side:
 * - Customer refund amount = unitPricePkr * quantityToReturn (recalculated, never trusted from client)
 * - Proportional commission reversal = floor((refundPkr * rateBps + 5000) / 10000)
 * - Net debit to seller = refundPkr - commissionReversalPkr
 */
export function calculatePartialReturn(
  input: PartialReturnItemInput
): PartialReturnCalculationResult {
  const unitPrice = typeof input.unitPricePkr === "bigint" 
    ? Number(input.unitPricePkr) 
    : input.unitPricePkr;

  if (unitPrice <= 0) throw new Error("Unit price must be positive");
  if (input.quantityToReturn <= 0) throw new Error("Return quantity must be at least 1");
  if (input.quantityToReturn > input.quantityOrdered) {
    throw new Error("Cannot return more items than originally ordered");
  }

  const recalculatedRefundPkr = unitPrice * input.quantityToReturn;
  const commissionReversalPkr = calculateCommissionPkr(
    recalculatedRefundPkr,
    input.commissionRateBps
  );
  const netSellerDebitPkr = recalculatedRefundPkr - commissionReversalPkr;

  return {
    recalculatedRefundPkr,
    commissionReversalPkr,
    netSellerDebitPkr,
  };
}
