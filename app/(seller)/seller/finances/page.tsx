import React from "react";
import { getSellerFinancesAction, getSellerLedgerAction } from "@/lib/actions/seller-finances";
import { FinancesClient } from "@/components/seller/finances-client";
import type { LedgerEntryType } from "@/lib/services/seller-finances";

export default async function SellerFinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = parseInt((params.page as string) || "1", 10);
  const entryType = (params.entryType as LedgerEntryType | "all") || "all";

  const [summary, ledger] = await Promise.all([
    getSellerFinancesAction(),
    getSellerLedgerAction(page, 20, entryType),
  ]);

  return (
    <FinancesClient
      summary={summary}
      ledger={ledger}
      currentEntryType={entryType}
    />
  );
}
