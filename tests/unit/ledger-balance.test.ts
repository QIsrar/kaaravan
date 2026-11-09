import { describe, it, expect } from "vitest";
import {
  aggregateLedgerBalances,
  type LedgerEntryMathItem,
} from "@/lib/financial/math";

describe("Phase 8 Financial Math: Ledger Balance Engine (balances = sums)", () => {
  const referenceNow = new Date("2026-11-09T12:00:00.000Z");
  const pastMatured = new Date("2026-11-02T12:00:00.000Z"); // 7 days ago (matured)
  const futureHeld = new Date("2026-11-16T12:00:00.000Z"); // 7 days in future (held)

  it("calculates empty ledger balances as zero", () => {
    const balances = aggregateLedgerBalances([], referenceNow);
    expect(balances).toEqual({
      totalBalancePkr: 0,
      availableBalancePkr: 0,
      heldBalancePkr: 0,
    });
  });

  it("correctly separates matured available funds from funds held in return window", () => {
    const entries: LedgerEntryMathItem[] = [
      // Order 1 (delivered 7 days ago, window elapsed -> matured)
      { amountPkr: 3500, availableAt: pastMatured },   // Sale: +3,500 PKR
      { amountPkr: -350, availableAt: pastMatured },   // Commission: -350 PKR
      { amountPkr: -250, availableAt: pastMatured },   // Shipping: -250 PKR

      // Order 2 (delivered today, 7-day return window pending -> held)
      { amountPkr: 5000, availableAt: futureHeld },    // Sale: +5,000 PKR
      { amountPkr: -500, availableAt: futureHeld },    // Commission: -500 PKR
      { amountPkr: -300, availableAt: futureHeld },    // Shipping: -300 PKR
    ];

    const result = aggregateLedgerBalances(entries, referenceNow);

    // Matured net: 3500 - 350 - 250 = 2,900 PKR
    expect(result.availableBalancePkr).toBe(2900);

    // Held net: 5000 - 500 - 300 = 4,200 PKR
    expect(result.heldBalancePkr).toBe(4200);

    // Total balance = sum of all entries = 2,900 + 4,200 = 7,100 PKR
    expect(result.totalBalancePkr).toBe(7100);
    expect(result.totalBalancePkr).toBe(result.availableBalancePkr + result.heldBalancePkr);
  });

  it("accurately handles payout disbursements under immediate debit", () => {
    const entries: LedgerEntryMathItem[] = [
      // Matured earnings
      { amountPkr: 2900, availableAt: pastMatured },
      // Admin approved payout of PKR 2,000
      { amountPkr: -2000, availableAt: referenceNow },
    ];

    const result = aggregateLedgerBalances(entries, referenceNow);

    // Remaining available: 2900 - 2000 = 900 PKR
    expect(result.availableBalancePkr).toBe(900);
    expect(result.totalBalancePkr).toBe(900);
    expect(result.heldBalancePkr).toBe(0);
  });

  it("handles string ISO timestamps and BigInt amounts interchangeably", () => {
    const entries: LedgerEntryMathItem[] = [
      { amountPkr: BigInt(1000), availableAt: "2026-11-01T00:00:00.000Z" },
      { amountPkr: BigInt(2000), availableAt: "2026-11-20T00:00:00.000Z" },
    ];

    const result = aggregateLedgerBalances(entries, referenceNow);
    expect(result.availableBalancePkr).toBe(1000);
    expect(result.heldBalancePkr).toBe(2000);
    expect(result.totalBalancePkr).toBe(3000);
  });

  it("matures held funds once the clock advances past the return window", () => {
    const entries: LedgerEntryMathItem[] = [
      { amountPkr: 5000, availableAt: futureHeld }, // 2026-11-16
    ];

    // Checked on 2026-11-09: held
    const beforeMaturity = aggregateLedgerBalances(entries, new Date("2026-11-09T12:00:00.000Z"));
    expect(beforeMaturity.availableBalancePkr).toBe(0);
    expect(beforeMaturity.heldBalancePkr).toBe(5000);

    // Checked on 2026-11-17: matured
    const afterMaturity = aggregateLedgerBalances(entries, new Date("2026-11-17T12:00:00.000Z"));
    expect(afterMaturity.availableBalancePkr).toBe(5000);
    expect(afterMaturity.heldBalancePkr).toBe(0);
    expect(afterMaturity.totalBalancePkr).toBe(5000);
  });
});
