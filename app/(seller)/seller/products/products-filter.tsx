"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function ProductsFilter() {
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
    <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          defaultValue={query}
          placeholder="Search products..." 
          className="pl-9 bg-background"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              router.push('?' + createQueryString('q', e.currentTarget.value));
            }
          }}
          onBlur={(e) => {
            if (e.target.value !== query) {
               router.push('?' + createQueryString('q', e.target.value));
            }
          }}
        />
      </div>
      <div className="w-full sm:w-48">
        <Select 
          value={statusFilter} 
          onValueChange={(val: string | null) => {
            if (val) router.push('?' + createQueryString('status', val));
          }}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
