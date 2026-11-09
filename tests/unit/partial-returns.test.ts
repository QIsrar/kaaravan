import { describe, it, expect } from "vitest";
import {
  calculatePartialReturn,
  aggregateLedgerBalances,
  type LedgerEntryMathItem,
} from "@/lib/financial/math";

describe("Phase 8 Financial Math: Partial Returns Across Sellers", () => {
  const referenceNow = new Date("2026-11-09T12:00:00.000Z");

  describe("Server-Side Recalculation & Proportional Commission Reversal", () => {
    it("recalculates 1 unit return for Seller A without trusting client amount", () => {
      // Seller A: 2 items ordered at PKR 2,500 each. Commission rate 10% (1000 bps).
      const result = calculatePartialReturn({
        unitPricePkr: 2500,
        quantityOrdered: 2,
        quantityToReturn: 1,
        commissionRateBps: 1000,
      });

      // Recalculated customer refund: 2,500 * 1 = PKR 2,500
      expect(result.recalculatedRefundPkr).toBe(2500);

      // Proportional commission reversal: (2,500 * 1000) / 10000 = PKR 250
      expect(result.commissionReversalPkr).toBe(250);

      // Net seller debit: 2,500 - 250 = PKR 2,250
      expect(result.netSellerDebitPkr).toBe(2250);
    });

    it("recalculates full return of all units, completely reversing subtotal and commission", () => {
      const result = calculatePartialReturn({
        unitPricePkr: 2500,
        quantityOrdered: 2,
        quantityToReturn: 2,
        commissionRateBps: 1000,
      });

      expect(result.recalculatedRefundPkr).toBe(5000); // 5,000 PKR
      expect(result.commissionReversalPkr).toBe(500);   // 500 PKR (full commission reversed)
      expect(result.netSellerDebitPkr).toBe(4500);      // Net debit
    });

    it("properly rounds fractional PKR commission reversal on odd unit prices", () => {
      // Unit price: 333 PKR. Rate: 700 bps (7.0%).
      // (333 * 700) / 10000 = 23.31 PKR -> rounds down to 23 PKR
      const result = calculatePartialReturn({
        unitPricePkr: 333,
        quantityOrdered: 1,
        quantityToReturn: 1,
        commissionRateBps: 700,
      });

      expect(result.recalculatedRefundPkr).toBe(333);
      expect(result.commissionReversalPkr).toBe(23);
      expect(result.netSellerDebitPkr).toBe(310);
    });

    it("throws when return quantity exceeds ordered quantity or is invalid", () => {
      expect(() =>
        calculatePartialReturn({
          unitPricePkr: 1000,
          quantityOrdered: 1,
          quantityToReturn: 2, // Exceeds ordered
          commissionRateBps: 1000,
        })
      ).toThrow("Cannot return more items than originally ordered");

      expect(() =>
        calculatePartialReturn({
          unitPricePkr: 1000,
          quantityOrdered: 2,
          quantityToReturn: 0, // Invalid zero
          commissionRateBps: 1000,
        })
      ).toThrow("Return quantity must be at least 1");
    });
  });

  describe("Multi-Seller Isolation Invariant", () => {
    it("ensures Seller B ledger is 100% unaffected by Seller A partial return", () => {
      // Initial Order Delivery:
      // Seller A (Pottery): Subtotal +5,000, Commission -500, Shipping -200 -> Net +4,300 PKR
      const sellerAInitial: LedgerEntryMathItem[] = [
        { amountPkr: 5000, availableAt: referenceNow },
        { amountPkr: -500, availableAt: referenceNow },
        { amountPkr: -200, availableAt: referenceNow },
      ];

      // Seller B (Shawls): Subtotal +8,000, Commission -1,200, Shipping -250 -> Net +6,550 PKR
      const sellerBInitial: LedgerEntryMathItem[] = [
        { amountPkr: 8000, availableAt: referenceNow },
        { amountPkr: -1200, availableAt: referenceNow },
        { amountPkr: -250, availableAt: referenceNow },
      ];

      const initialBalA = aggregateLedgerBalances(sellerAInitial, referenceNow);
      const initialBalB = aggregateLedgerBalances(sellerBInitial, referenceNow);

      expect(initialBalA.totalBalancePkr).toBe(4300);
      expect(initialBalB.totalBalancePkr).toBe(6550);

      // Now customer returns 1 unit of Seller A's item (unit price 2,500, 10% comm):
      const partialReturnA = calculatePartialReturn({
        unitPricePkr: 2500,
        quantityOrdered: 2,
        quantityToReturn: 1,
        commissionRateBps: 1000,
      });

      // Append 2 reversing entries to Seller A ledger:
      const sellerAPostReturn: LedgerEntryMathItem[] = [
        ...sellerAInitial,
        { amountPkr: -partialReturnA.recalculatedRefundPkr, availableAt: referenceNow }, // -2,500 (refund)
        { amountPkr: partialReturnA.commissionReversalPkr, availableAt: referenceNow },   // +250 (commission reversal)
      ];

      // Seller B ledger has NO new entries:
      const sellerBPostReturn = [...sellerBInitial];

      const postBalA = aggregateLedgerBalances(sellerAPostReturn, referenceNow);
      const postBalB = aggregateLedgerBalances(sellerBPostReturn, referenceNow);

      // Seller A balance decreases by net debit of 2,250:
      // 4,300 - 2,250 = 2,050 PKR
      expect(postBalA.totalBalancePkr).toBe(2050);

      // Invariant: Seller B's balance remains strictly identical to initial
      expect(postBalB.totalBalancePkr).toBe(6550);
      expect(postBalB.totalBalancePkr).toBe(initialBalB.totalBalancePkr);
    });
  });
});
