"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";

export function ProductsFilter() {
  const t = useTranslations("seller.catalog");
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-2xl border border-border/80 shadow-2xs">
      <div className="relative flex-1">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          defaultValue={query}
          placeholder={t("searchPlaceholder")}
          className="ps-9 bg-background rounded-xl"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              router.push("?" + createQueryString("q", e.currentTarget.value));
            }
          }}
          onBlur={(e) => {
            if (e.target.value !== query) {
              router.push("?" + createQueryString("q", e.target.value));
            }
          }}
        />
      </div>
      <div className="w-full sm:w-52">
        <Select
          value={statusFilter}
          onValueChange={(val: string | null) => {
            if (val) router.push("?" + createQueryString("status", val));
          }}
        >
          <SelectTrigger className="bg-background rounded-xl">
            <SelectValue placeholder={t("allStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            <SelectItem value="active">{t("statusActive")}</SelectItem>
            <SelectItem value="draft">{t("statusDraft")}</SelectItem>
            <SelectItem value="pending_review">{t("statusPendingReview")}</SelectItem>
            <SelectItem value="archived">{t("statusArchived")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
