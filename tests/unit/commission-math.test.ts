import { describe, it, expect } from "vitest";
import {
  calculateCommissionPkr,
  resolveCommissionRate,
  DEFAULT_PLATFORM_COMMISSION_BPS,
} from "@/lib/financial/math";

describe("Phase 8 Financial Math: Whole-PKR Commission & Rounding Rules", () => {
  describe("Commission Rate Priority Hierarchy", () => {
    it("uses seller override when present, ignoring category and platform default", () => {
      const rate = resolveCommissionRate(1200, 800, 500);
      expect(rate).toBe(1200); // 12%
    });

    it("falls back to category rate when seller override is null or undefined", () => {
      expect(resolveCommissionRate(null, 750)).toBe(750); // 7.5%
      expect(resolveCommissionRate(undefined, 850)).toBe(850); // 8.5%
    });

    it("falls back to platform default (500 bps = 5.0%) when both seller and category are unset", () => {
      expect(resolveCommissionRate(null, null)).toBe(DEFAULT_PLATFORM_COMMISSION_BPS);
      expect(resolveCommissionRate(undefined, undefined)).toBe(500);
    });

    it("accepts a 0 bps seller override (0% promotional rate)", () => {
      expect(resolveCommissionRate(0, 1000, 500)).toBe(0);
    });
  });

  describe("Documented Rounding Rule: floor((amount_pkr * rate_bps + 5000) / 10000)", () => {
    it("computes exact integer PKR without rounding needed", () => {
      // PKR 1,000 at 1000 bps (10.0%) = PKR 100
      expect(calculateCommissionPkr(1000, 1000)).toBe(100);

      // PKR 3,500 at 500 bps (5.0%) = PKR 175
      expect(calculateCommissionPkr(3500, 500)).toBe(175);

      // PKR 25,000 at 200 bps (2.0%) = PKR 500
      expect(calculateCommissionPkr(25000, 200)).toBe(500);
    });

    it("confirms boundary test: values ending in .49 mathematically round down", () => {
      // 1) 49 PKR at 100 bps (1.0%):
      // (49 * 100) / 10000 = 4900 / 10000 = 0.49 PKR -> rounds down to 0 PKR
      expect(calculateCommissionPkr(49, 100)).toBe(0);

      // 2) 149 PKR at 100 bps (1.0%):
      // (149 * 100) / 10000 = 14900 / 10000 = 1.49 PKR -> rounds down to 1 PKR
      expect(calculateCommissionPkr(149, 100)).toBe(1);

      // 3) 298 PKR at 50 bps (0.5%):
      // (298 * 50) / 10000 = 14900 / 10000 = 1.49 PKR -> rounds down to 1 PKR
      expect(calculateCommissionPkr(298, 50)).toBe(1);

      // 4) 2549 PKR at 100 bps (1.0%):
      // (2549 * 100) / 10000 = 254900 / 10000 = 25.49 PKR -> rounds down to 25 PKR
      expect(calculateCommissionPkr(2549, 100)).toBe(25);
    });

    it("confirms boundary test: values ending in .50 mathematically round up (half-up rule)", () => {
      // 1) 50 PKR at 100 bps (1.0%):
      // (50 * 100) / 10000 = 5000 / 10000 = 0.50 PKR -> rounds up to 1 PKR
      expect(calculateCommissionPkr(50, 100)).toBe(1);

      // 2) 150 PKR at 100 bps (1.0%):
      // (150 * 100) / 10000 = 15000 / 10000 = 1.50 PKR -> rounds up to 2 PKR
      expect(calculateCommissionPkr(150, 100)).toBe(2);

      // 3) 300 PKR at 50 bps (0.5%):
      // (300 * 50) / 10000 = 15000 / 10000 = 1.50 PKR -> rounds up to 2 PKR
      expect(calculateCommissionPkr(300, 50)).toBe(2);

      // 4) 2550 PKR at 100 bps (1.0%):
      // (2550 * 100) / 10000 = 255000 / 10000 = 25.50 PKR -> rounds up to 26 PKR
      expect(calculateCommissionPkr(2550, 100)).toBe(26);
    });

    it("rounds down when fractional PKR is strictly less than 0.5", () => {
      // 101 PKR at 1500 bps (15.0%):
      // (101 * 1500) / 10000 = 151500 / 10000 = 15.15 PKR -> rounds down to 15 PKR
      expect(calculateCommissionPkr(101, 1500)).toBe(15);

      // 10 PKR at 49 bps (0.49%):
      // (10 * 49) / 10000 = 490 / 10000 = 0.049 PKR -> rounds down to 0 PKR
      expect(calculateCommissionPkr(10, 49)).toBe(0);
    });

    it("rounds up when fractional PKR is strictly greater than 0.5", () => {
      // 105 PKR at 1500 bps (15.0%):
      // (105 * 1500) / 10000 = 157500 / 10000 = 15.75 PKR -> rounds up to 16 PKR
      expect(calculateCommissionPkr(105, 1500)).toBe(16);

      // 99 PKR at 500 bps (5.0%):
      // (99 * 500) / 10000 = 49500 / 10000 = 4.95 PKR -> rounds up to 5 PKR
      expect(calculateCommissionPkr(99, 500)).toBe(5);
    });

    it("handles zero and negative edge cases defensively", () => {
      expect(calculateCommissionPkr(0, 1000)).toBe(0);
      expect(calculateCommissionPkr(1000, 0)).toBe(0);
      expect(calculateCommissionPkr(-500, 1000)).toBe(0);
      expect(calculateCommissionPkr(1000, -500)).toBe(0);
    });

    it("supports BigInt values seamlessly without loss of precision", () => {
      expect(calculateCommissionPkr(BigInt(1000000), 1250)).toBe(125000);
      expect(calculateCommissionPkr(BigInt(999999), 1000)).toBe(100000); // 99999.9 -> 100000
    });
  });
});
