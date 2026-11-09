/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import {
  requestPayoutSchema,
  approvePayoutSchema,
  rejectPayoutSchema,
} from "@/lib/validators/admin";
import type { Database } from "@/lib/types/database";

export type PayoutStatus = Database["public"]["Enums"]["payout_status"];
export type ActorRole = "superadmin" | "admin_staff";

export interface RequestPayoutResult {
  success: true;
  payoutId: string;
  sellerId: string;
  amountPkr: number;
  availableBalancePkr: number;
  remainingAvailablePkr: number;
  amountMinor: number;
  availableBalanceMinor: number;
  remainingAvailableMinor: number;
  status: "requested";
}

export interface ApprovePayoutResult {
  success: true;
  payoutId: string;
  amountPkr: number;
  status: PayoutStatus;
  balanceAfterPkr: number;
  amountMinor: number;
  balanceAfterMinor: number;
}

/**
 * Phase 8 Function 8: Seller Requests Payout from Available Balance
 * 
 * Rules:
 * - Seller must be in 'approved' status.
 * - Seller must have bank details on file.
 * - Atomic database execution via request_payout RPC under row lock on sellers (MED-04).
 * - Amount cannot exceed currently available balance minus already requested pending payouts.
 */
export async function requestSellerPayout(
  sellerProfileId: string,
  amountInput: number,
  ipAddress: string
): Promise<RequestPayoutResult> {
  const validated = requestPayoutSchema.parse({ amountPkr: amountInput });
  const amountPkr = validated.amountPkr ?? validated.amountMinor ?? amountInput;
  const supabase = createAdminClient();

  // 1. Verify seller is approved
  const { data: seller, error: sErr } = await supabase
    .from("sellers")
    .select("id, status, business_name")
    .eq("owner_profile_id", sellerProfileId)
    .single();

  if (sErr || !seller) {
    throw new Error("Unauthorized: Seller not found");
  }

  if (seller.status !== "approved") {
    throw new Error("Only approved sellers can request payouts");
  }

  // 2. Atomic database RPC under row lock on sellers (MED-04)
  const { data: rpcData, error: rpcErr } = await supabase.rpc("request_payout", {
    p_seller_id: seller.id,
    p_amount_pkr: amountPkr,
    p_ip_address: ipAddress,
  });

  if (rpcErr) {
    console.error("request_payout RPC failed:", rpcErr.message);
    throw new Error(rpcErr.message);
  }

  const res = rpcData as {
    success: boolean;
    payout_id: string;
    seller_id: string;
    amount_pkr: number;
    available_balance_pkr: number;
    remaining_available_pkr: number;
    status: "requested";
  };

  return {
    success: true,
    payoutId: res.payout_id,
    sellerId: res.seller_id,
    amountPkr: Number(res.amount_pkr),
    availableBalancePkr: Number(res.available_balance_pkr),
    remainingAvailablePkr: Number(res.remaining_available_pkr),
    amountMinor: Number(res.amount_pkr),
    availableBalanceMinor: Number(res.available_balance_pkr),
    remainingAvailableMinor: Number(res.remaining_available_pkr),
    status: "requested",
  };
}

/**
 * Phase 8 Function 8: Admin Approval of Seller Payout
 * 
 * Invokes the atomic PostgreSQL function public.approve_payout:
 * - Row lock on seller and payout FOR UPDATE.
 * - Recalculates available balance in Postgres transaction.
 * - Enforces payout cannot exceed available balance.
 * - Writes negative payout entry into seller_ledger.
 * - Updates payout record to 'approved' or 'paid'.
 * - Writes audit log.
 */
export async function approveAdminPayout(params: {
  payoutId: string;
  adminId: string;
  adminRole: ActorRole;
  bankReference?: string;
  ipAddress: string;
}): Promise<ApprovePayoutResult> {
  const hasPerm = await checkAdminPermission(params.adminId, params.adminRole, "manage_finance");
  if (!hasPerm) {
    throw new Error("Access denied: manage_finance permission required");
  }

  const validated = approvePayoutSchema.parse({ bankReference: params.bankReference });
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("approve_payout", {
    p_payout_id: params.payoutId,
    p_admin_id: params.adminId,
    p_bank_reference: validated.bankReference ?? undefined,
    p_ip_address: params.ipAddress,
  });

  if (error) {
    console.error("approve_payout RPC failed:", error.message);
    throw new Error(error.message);
  }

  const res = data as {
    success: boolean;
    payout_id: string;
    amount_pkr: number;
    amount_minor?: number;
    status: PayoutStatus;
    balance_after_pkr: number;
    balance_after_minor?: number;
  };

  const amountPkr = Number(res.amount_pkr ?? res.amount_minor);
  const balanceAfterPkr = Number(res.balance_after_pkr ?? res.balance_after_minor);

  return {
    success: true,
    payoutId: res.payout_id,
    amountPkr,
    amountMinor: amountPkr,
    status: res.status,
    balanceAfterPkr,
    balanceAfterMinor: balanceAfterPkr,
  };
}

/**
 * Admin Rejection of Payout Request with Mandatory Reason
 */
export async function rejectAdminPayout(params: {
  payoutId: string;
  adminId: string;
  adminRole: ActorRole;
  reason: string;
  ipAddress: string;
}): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(params.adminId, params.adminRole, "manage_finance");
  if (!hasPerm) {
    throw new Error("Access denied: manage_finance permission required");
  }

  const validated = rejectPayoutSchema.parse({ reason: params.reason });
  const supabase = createAdminClient();

  const { error } = await supabase.rpc("reject_payout", {
    p_payout_id: params.payoutId,
    p_admin_id: params.adminId,
    p_reason: validated.reason,
    p_ip_address: params.ipAddress,
  });

  if (error) {
    console.error("reject_payout RPC failed:", error.message);
    throw new Error(error.message);
  }

  return { success: true };
}

/**
 * Returns payout history for the logged-in seller.
 */
export async function getSellerPayouts(
  sellerProfileId: string,
  params: {
    page?: number;
    limit?: number;
    status?: PayoutStatus | "all";
  }
) {
  const supabase = createAdminClient();

  const { data: seller, error: sErr } = await supabase
    .from("sellers")
    .select("id")
    .eq("owner_profile_id", sellerProfileId)
    .single();

  if (sErr || !seller) {
    throw new Error("Unauthorized: Seller not found");
  }

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("payouts")
    .select("id, amount_pkr, status, bank_reference, paid_at, created_at, updated_at", {
      count: "exact",
    })
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("Failed to query seller payouts:", error.message);
    throw new Error("Failed to load payout history");
  }

  return {
    payouts: (data || []).map((row) => ({
      id: row.id,
      amountPkr: Number(row.amount_pkr),
      amountMinor: Number(row.amount_pkr),
      status: row.status,
      bankReference: row.bank_reference,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    totalCount: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit) || 1,
  };
}

/**
 * Lists payouts across the platform for admin finance review.
 */
export async function listAdminPayouts(params: {
  page?: number;
  limit?: number;
  status?: PayoutStatus | "all";
}) {
  const supabase = createAdminClient();
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("payouts")
    .select(
      `
      id,
      seller_id,
      amount_pkr,
      status,
      bank_reference,
      paid_at,
      created_at,
      updated_at,
      sellers (
        id,
        business_name,
        seller_bank_accounts (
          bank_name,
          account_title,
          iban,
          is_verified
        )
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("Failed to list admin payouts:", error.message);
    throw new Error("Failed to load payouts queue");
  }

  return {
    payouts: data || [],
    totalCount: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit) || 1,
  };
}
