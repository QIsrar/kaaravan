import React from "react";
import { getTranslations } from "next-intl/server";
import { getSellerOrdersAction } from "@/lib/actions/seller-orders";
import { OrdersList } from "@/components/seller/orders-list";
import { SubOrderStatus } from "@/lib/services/order-status";

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("seller");
  
  const params = await searchParams;
  const status = (params.status || "all") as SubOrderStatus | "all";
  const search = (params.search as string) || "";
  const page = parseInt((params.page as string) || "1", 10);

  const { orders } = await getSellerOrdersAction(status, search, page);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">{t("dashboardTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboardSubtitle")}</p>
        </div>
      </div>

      <OrdersList initialOrders={orders} status={status} search={search} />
    </div>
  );
}
