"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatPaisa } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import Link from "next/link";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

export interface OrderListItem {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerCity: string;
  itemCount: number;
  totalMinor: number;
  status: string;
}

export function OrdersList({
  initialOrders,
  status,
  search,
}: {
  initialOrders: OrderListItem[];
  status: string;
  search: string;
}) {
  const t = useTranslations("seller.orders_list");
  const tOrders = useTranslations("orders");
  const router = useRouter();
  const [searchValue, setSearchValue] = React.useState(search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchValue) {
      params.set("search", searchValue);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/seller/orders?${params.toString()}`);
  };

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(window.location.search);
    if (newStatus !== "all") {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`/seller/orders?${params.toString()}`);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    packed: "bg-indigo-100 text-indigo-800",
    ready_to_ship: "bg-purple-100 text-purple-800",
    shipped: "bg-green-100 text-green-800",
    delivered: "bg-green-200 text-green-900",
    cancelled: "bg-red-100 text-red-800",
    returned: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {["all", "pending", "confirmed", "packed", "ready_to_ship", "shipped", "delivered", "cancelled"].map(s => (
            <Button
              key={s}
              variant={status === s ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(s)}
              className="capitalize whitespace-nowrap"
            >
              {tOrders(`status.${s}` as Parameters<typeof tOrders>[0]) || s.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full">
          <Input 
            placeholder={t("searchPlaceholder")} 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        {initialOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <p>{t("noOrders")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orderNumber")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("items")}</TableHead>
                <TableHead>{t("total")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                  <TableCell>
                    {order.customerName}
                    <div className="text-xs text-muted-foreground">{order.customerCity}</div>
                  </TableCell>
                  <TableCell>{order.itemCount}</TableCell>
                  <TableCell>{formatPaisa(order.totalMinor)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`capitalize ${statusColors[order.status] || ""}`}>
                      {tOrders(`status.${order.status}` as Parameters<typeof tOrders>[0]) || order.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link 
                      href={`/seller/orders/${order.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      {t("viewDetails")}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
