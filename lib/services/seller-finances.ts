/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

export type LedgerEntryType = Database["public"]["Enums"]["ledger_entry_type"];

export interface SellerFinancialSummary {
  sellerId: string;
  businessName: string;
  currency: string;
  availableBalancePkr: number;
  heldBalancePkr: number;
  totalBalancePkr: number;
  totalSalesPkr: number;
  totalCommissionPkr: number;
  totalShippingPkr: number;
  totalPayoutsPkr: number;
  totalRefundsPkr: number;
  availableBalanceMinor: number;
  heldBalanceMinor: number;
  totalBalanceMinor: number;
  totalSalesMinor: number;
  totalCommissionMinor: number;
  totalShippingMinor: number;
  totalPayoutsMinor: number;
  totalRefundsMinor: number;
  returnWindowDays: number;
}

export interface SellerLedgerItem {
  id: string;
  subOrderId: string | null;
  orderNumber: string | null;
  entryType: LedgerEntryType;
  amountPkr: number;
  balanceAfterPkr: number;
  amountMinor: number;
  balanceAfterMinor: number;
  availableAt: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface SellerLedgerResult {
  entries: SellerLedgerItem[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Recalculates and aggregates real seller balances and totals from the immutable ledger in whole PKR.
 * Balances = sums.
 * available_balance = sum(amount_pkr) where available_at <= now()
 * held_balance = sum(amount_pkr) where available_at > now()
 */
export async function getSellerFinancialSummary(
  sellerProfileId: string
): Promise<SellerFinancialSummary> {
  const supabase = createAdminClient();

  // 1. Verify seller profile
  const { data: seller, error: sellerErr } = await supabase
    .from("sellers")
    .select("id, status, business_name, return_window_days")
    .eq("owner_profile_id", sellerProfileId)
    .single();

  if (sellerErr || !seller) {
    throw new Error("Unauthorized: Seller not found");
  }

  // 2. Fetch all ledger rows for aggregation (balances = sums)
  const { data: rows, error: ledgerErr } = await supabase
    .from("seller_ledger")
    .select("entry_type, amount_pkr, available_at")
    .eq("seller_id", seller.id);

  if (ledgerErr) {
    console.error("Failed to query seller ledger for summary:", ledgerErr.message);
    throw new Error("Failed to load financial records");
  }

  const now = Date.now();
  let availableBalancePkr = 0;
  let heldBalancePkr = 0;
  let totalSalesPkr = 0;
  let totalCommissionPkr = 0;
  let totalShippingPkr = 0;
  let totalPayoutsPkr = 0;
  let totalRefundsPkr = 0;

  for (const row of rows || []) {
    const amt = Number(row.amount_pkr);
    const isAvailable = new Date(row.available_at).getTime() <= now;

    if (isAvailable) {
      availableBalancePkr += amt;
    } else {
      heldBalancePkr += amt;
    }

    if (row.entry_type === "sale") {
      totalSalesPkr += amt;
    } else if (row.entry_type === "commission") {
      totalCommissionPkr += Math.abs(amt);
    } else if (row.entry_type === "shipping_fee") {
      totalShippingPkr += Math.abs(amt);
    } else if (row.entry_type === "payout") {
      totalPayoutsPkr += Math.abs(amt);
    } else if (row.entry_type === "refund") {
      totalRefundsPkr += Math.abs(amt);
    }
  }

  const totalBalancePkr = availableBalancePkr + heldBalancePkr;

  return {
    sellerId: seller.id,
    businessName: seller.business_name,
    currency: "PKR",
    availableBalancePkr,
    heldBalancePkr,
    totalBalancePkr,
    totalSalesPkr,
    totalCommissionPkr,
    totalShippingPkr,
    totalPayoutsPkr,
    totalRefundsPkr,
    availableBalanceMinor: availableBalancePkr,
    heldBalanceMinor: heldBalancePkr,
    totalBalanceMinor: totalBalancePkr,
    totalSalesMinor: totalSalesPkr,
    totalCommissionMinor: totalCommissionPkr,
    totalShippingMinor: totalShippingPkr,
    totalPayoutsMinor: totalPayoutsPkr,
    totalRefundsMinor: totalRefundsPkr,
    returnWindowDays: seller.return_window_days ?? 7,
  };
}

/**
 * Returns paginated, chronological ledger records with order numbers and availability status.
 */
export async function getSellerLedgerEntries(
  sellerProfileId: string,
  params: {
    page: number;
    limit: number;
    entryType?: LedgerEntryType | "all";
  }
): Promise<SellerLedgerResult> {
  const supabase = createAdminClient();

  // 1. Verify seller profile
  const { data: seller, error: sellerErr } = await supabase
    .from("sellers")
    .select("id")
    .eq("owner_profile_id", sellerProfileId)
    .single();

  if (sellerErr || !seller) {
    throw new Error("Unauthorized: Seller not found");
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("seller_ledger")
    .select(
      `
      id,
      sub_order_id,
      entry_type,
      amount_pkr,
      balance_after_pkr,
      available_at,
      created_at,
      sub_orders (
        id,
        orders (
          order_number
        )
      )
    `,
      { count: "exact" }
    )
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  if (params.entryType && params.entryType !== "all") {
    query = query.eq("entry_type", params.entryType);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("Failed to query seller ledger entries:", error.message);
    throw new Error("Failed to load ledger history");
  }

  const now = Date.now();
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const entries: SellerLedgerItem[] = (data || []).map((row) => {
    const isAvailable = new Date(row.available_at).getTime() <= now;
    const subOrder = row.sub_orders as { id: string; orders: { order_number: string } | null } | null;
    const orderNumber = subOrder?.orders?.order_number ?? null;

    return {
      id: row.id,
      subOrderId: row.sub_order_id,
      orderNumber,
      entryType: row.entry_type,
      amountPkr: Number(row.amount_pkr),
      balanceAfterPkr: Number(row.balance_after_pkr),
      amountMinor: Number(row.amount_pkr),
      balanceAfterMinor: Number(row.balance_after_pkr),
      availableAt: row.available_at,
      isAvailable,
      createdAt: row.created_at,
    };
  });

  return {
    entries,
    totalCount,
    page,
    limit,
    totalPages,
  };
}

