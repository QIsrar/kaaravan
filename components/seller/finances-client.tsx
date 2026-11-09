"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Wallet,
  Clock,
  ShieldCheck,
  TrendingUp,
  Percent,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import { formatPaisa, parseRupeesToPaisa, formatPaisaToRupees } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requestPayoutAction } from "@/lib/actions/seller-finances";
import type {
  SellerFinancialSummary,
  SellerLedgerItem,
  LedgerEntryType,
} from "@/lib/services/seller-finances";
import { cn } from "@/lib/utils";

interface FinancesClientProps {
  summary: SellerFinancialSummary;
  ledger: {
    entries: SellerLedgerItem[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  currentEntryType: string;
}

export function FinancesClient({
  summary,
  ledger,
  currentEntryType,
}: FinancesClientProps) {
  const t = useTranslations("seller.finances");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (entryType: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (entryType && entryType !== "all") {
      params.set("entryType", entryType);
    } else {
      params.delete("entryType");
    }
    params.set("page", "1");
    router.push(`/seller/finances?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("page", newPage.toString());
    router.push(`/seller/finances?${params.toString()}`);
  };

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmountRupees, setPayoutAmountRupees] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmountRupees || isSubmittingPayout) return;

    try {
      const amountMinor = parseRupeesToPaisa(payoutAmountRupees);
      if (amountMinor <= 0) {
        toast.error("Please enter a valid amount greater than 0");
        return;
      }
      if (amountMinor > summary.availableBalanceMinor) {
        toast.error("Amount cannot exceed your available balance");
        return;
      }

      setIsSubmittingPayout(true);
      await requestPayoutAction(amountMinor);
      toast.success(t("payoutSuccess"));
      setIsPayoutModalOpen(false);
      setPayoutAmountRupees("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("payoutError"));
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const filterTabs = [
    { key: "all", label: t("filterAll") },
    { key: "sale", label: t("filterSale") },
    { key: "commission", label: t("filterCommission") },
    { key: "shipping_fee", label: t("filterShipping") },
    { key: "payout", label: t("filterPayout") },
    { key: "refund", label: t("filterRefund") },
  ];

  const getEntryBadge = (type: LedgerEntryType) => {
    switch (type) {
      case "sale":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
            <ArrowUpRight className="w-3 h-3 me-1" />
            {t("badgeSale")}
          </Badge>
        );
      case "commission":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20">
            <Percent className="w-3 h-3 me-1" />
            {t("badgeCommission")}
          </Badge>
        );
      case "shipping_fee":
        return (
          <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 hover:bg-sky-500/20">
            <Truck className="w-3 h-3 me-1" />
            {t("badgeShipping")}
          </Badge>
        );
      case "payout":
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20">
            <ArrowDownRight className="w-3 h-3 me-1" />
            {t("badgePayout")}
          </Badge>
        );
      case "refund":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20">
            <ArrowDownRight className="w-3 h-3 me-1" />
            {t("badgeRefund")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {t("badgeAdjustment")}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button
          onClick={() => setIsPayoutModalOpen(true)}
          disabled={summary.availableBalanceMinor <= 0}
          className="rounded-2xl gap-2 font-medium shadow-sm hover:shadow"
        >
          <Wallet className="w-4 h-4" />
          {t("requestPayout")}
        </Button>
      </div>

      {/* Return Window Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/40 border border-secondary text-sm">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            {summary.businessName} &middot; {t("returnWindowNotice", { days: summary.returnWindowDays })}
          </p>
        </div>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Available Balance */}
        <div className="p-6 rounded-3xl bg-card border border-emerald-500/30 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {t("availableBalance")}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
              {formatPaisa(summary.availableBalanceMinor)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("availableBalanceDesc")}
            </p>
          </div>
        </div>

        {/* Held Balance */}
        <div className="p-6 rounded-3xl bg-card border border-amber-500/30 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {t("heldBalance")}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-heading text-amber-600 dark:text-amber-400">
              {formatPaisa(summary.heldBalanceMinor)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("heldBalanceDesc", { days: summary.returnWindowDays })}
            </p>
          </div>
        </div>

        {/* Total Ledger Balance */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {t("totalBalance")}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold font-heading text-foreground">
              {formatPaisa(summary.totalBalanceMinor)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("totalBalanceDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-card/60 border border-border/80">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-primary" />
            {t("grossSales")}
          </div>
          <div className="text-xl font-bold font-heading text-foreground mt-2">
            {formatPaisa(summary.totalSalesMinor)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("grossSalesDesc")}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card/60 border border-border/80">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Percent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            {t("platformCommission")}
          </div>
          <div className="text-xl font-bold font-heading text-amber-600 dark:text-amber-400 mt-2">
            -{formatPaisa(summary.totalCommissionMinor)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("platformCommissionDesc")}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card/60 border border-border/80">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            {t("shippingDeductions")}
          </div>
          <div className="text-xl font-bold font-heading text-sky-600 dark:text-sky-400 mt-2">
            -{formatPaisa(summary.totalShippingMinor)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("shippingDeductionsDesc")}
          </p>
        </div>
      </div>

      {/* Ledger Section */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              {t("ledgerTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("ledgerSubtitle")}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {filterTabs.map((tab) => {
              const active = (currentEntryType || "all") === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleFilterChange(tab.key)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
          {ledger.entries.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground">
                {t("emptyTitle")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                {t("emptyDesc")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[180px]">{t("tableDate")}</TableHead>
                  <TableHead className="w-[140px]">{t("tableType")}</TableHead>
                  <TableHead className="w-[150px]">{t("tableOrder")}</TableHead>
                  <TableHead>{t("tableStatus")}</TableHead>
                  <TableHead className="text-end">{t("tableAmount")}</TableHead>
                  <TableHead className="text-end">{t("tableBalance")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.entries.map((entry) => {
                  const isPositive = entry.amountMinor > 0;
                  const isZero = entry.amountMinor === 0;

                  return (
                    <TableRow key={entry.id} className="transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatDate(entry.createdAt, locale, true)}
                      </TableCell>
                      <TableCell>{getEntryBadge(entry.entryType)}</TableCell>
                      <TableCell>
                        {entry.subOrderId ? (
                          <Link
                            href={`/seller/orders/${entry.subOrderId}`}
                            className="text-xs font-mono font-medium text-primary hover:underline"
                          >
                            {entry.orderNumber ? `#${entry.orderNumber}` : t("viewSubOrder")}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.isAvailable ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {t("statusAvailable")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            <Clock className="w-3 h-3" />
                            {t("statusHeldUntil", {
                              date: formatDate(entry.availableAt, locale, false),
                            })}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-end font-mono font-semibold">
                        {isZero ? (
                          <span className="text-muted-foreground">PKR 0</span>
                        ) : isPositive ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +{formatPaisa(entry.amountMinor)}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400">
                            -{formatPaisa(Math.abs(entry.amountMinor))}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-end font-mono font-medium text-foreground">
                        {formatPaisa(entry.balanceAfterMinor)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {ledger.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {t("paginationPage", { current: ledger.page, total: ledger.totalPages })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={ledger.page <= 1}
                onClick={() => handlePageChange(ledger.page - 1)}
                className="gap-1 rounded-xl text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                {t("paginationPrev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={ledger.page >= ledger.totalPages}
                onClick={() => handlePageChange(ledger.page + 1)}
                className="gap-1 rounded-xl text-xs"
              >
                {t("paginationNext")}
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Request Payout Dialog */}
      <AlertDialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <AlertDialogContent className="max-w-md rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-heading font-bold text-foreground">
              {t("requestPayoutTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {t("requestPayoutDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handlePayoutSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label htmlFor="payout-amount" className="font-medium text-foreground">
                  {t("payoutAmount")}
                </Label>
                <span className="text-muted-foreground">
                  {t("availableToWithdraw", {
                    amount: formatPaisa(summary.availableBalanceMinor),
                  })}
                </span>
              </div>
              <div className="relative">
                <Input
                  id="payout-amount"
                  type="number"
                  step="any"
                  min="1"
                  placeholder="0"
                  value={payoutAmountRupees}
                  onChange={(e) => setPayoutAmountRupees(e.target.value)}
                  disabled={isSubmittingPayout}
                  className="rounded-xl pe-16 font-mono font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setPayoutAmountRupees(
                      formatPaisaToRupees(summary.availableBalanceMinor)
                    )
                  }
                  disabled={isSubmittingPayout || summary.availableBalanceMinor <= 0}
                  className="absolute inset-y-1 end-1 px-3 flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors rounded-lg bg-primary/10 hover:bg-primary/20 disabled:opacity-50"
                >
                  {t("max")}
                </button>
              </div>
            </div>

            <AlertDialogFooter className="pt-2">
              <AlertDialogCancel
                type="button"
                disabled={isSubmittingPayout}
                className="rounded-xl"
              >
                {t("close")}
              </AlertDialogCancel>
              <Button
                type="submit"
                disabled={isSubmittingPayout}
                className="rounded-xl gap-2"
              >
                {isSubmittingPayout ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("submittingPayout")}
                  </>
                ) : (
                  t("submitPayout")
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

