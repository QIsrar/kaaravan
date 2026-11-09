"use server";

import { requireAuth } from "@/lib/auth/roles";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  getSellerFinancialSummary,
  getSellerLedgerEntries,
  type LedgerEntryType,
} from "@/lib/services/seller-finances";
import {
  requestSellerPayout,
  getSellerPayouts,
  type PayoutStatus,
} from "@/lib/services/payouts";
import { getClientIp } from "@/lib/utils";

export async function getSellerFinancesAction() {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");
  return getSellerFinancialSummary(profile.id);
}

export async function getSellerLedgerAction(
  page: number = 1,
  limit: number = 20,
  entryType?: LedgerEntryType | "all"
) {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");
  return getSellerLedgerEntries(profile.id, { page, limit, entryType });
}

export async function requestPayoutAction(amountMinor: number) {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");

  const headersList = await headers();
  const ipAddress = getClientIp(headersList);

  const result = await requestSellerPayout(profile.id, amountMinor, ipAddress);
  revalidatePath("/seller/finances");
  return result;
}

export async function getSellerPayoutsAction(
  page: number = 1,
  limit: number = 20,
  status?: PayoutStatus | "all"
) {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");
  return getSellerPayouts(profile.id, { page, limit, status });
}

