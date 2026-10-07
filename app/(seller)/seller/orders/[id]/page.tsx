import React from "react";
import { getSellerOrderDetailsAction } from "@/lib/actions/seller-orders";
import { OrderDetailsView } from "@/components/seller/order-details";

export default async function SellerOrderDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const orderDetails = await getSellerOrderDetailsAction(id);

  return (
    <div className="space-y-6">
      <OrderDetailsView order={orderDetails} />
    </div>
  );
}
