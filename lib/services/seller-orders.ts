/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { SubOrderStatus } from "./order-status";

export async function getSellerOrders(
  sellerProfileId: string,
  params: {
    status?: SubOrderStatus | "all";
    search?: string;
    page: number;
    limit: number;
  }
) {
  const supabase = createAdminClient();

  // Verify ownership and get seller_id
  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("id, status")
    .eq("owner_profile_id", sellerProfileId)
    .single();

  if (sellerError || !seller || seller.status !== "approved") {
    throw new Error("Unauthorized: Seller not found or not approved");
  }

  const { status, search, page, limit } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("sub_orders")
    .select(
      `
      id,
      status,
      created_at,
      total_minor,
      orders!inner(order_number, shipping_address),
      order_items(id)
    `,
      { count: "exact" }
    )
    .eq("seller_id", seller.id);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.ilike("orders.order_number", `%${search}%`);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  // Transform data
  type SubOrderRow = {
    id: string;
    status: string;
    created_at: string;
    total_minor: number;
    orders: { order_number: string; shipping_address: Record<string, unknown> };
    order_items: { id: string }[];
  };

  const orders = (data as SubOrderRow[]).map((so) => {
    // Privacy: Only show name + city here
    const address = so.orders.shipping_address as Record<string, string>;
    return {
      id: so.id,
      orderNumber: so.orders.order_number,
      date: so.created_at,
      status: so.status,
      itemCount: so.order_items.length,
      totalMinor: so.total_minor,
      customerName: address?.full_name?.split(" ")[0] || "Customer",
      customerCity: address?.city || "Unknown",
    };
  });

  return { orders, totalCount: count || 0 };
}

export async function getSellerOrderDetails(
  sellerProfileId: string,
  subOrderId: string
) {
  const supabase = createAdminClient();

  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("id, status, business_name")
    .eq("owner_profile_id", sellerProfileId)
    .single();

  if (sellerError || !seller || seller.status !== "approved") {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("sub_orders")
    .select(
      `
      id,
      status,
      subtotal_minor,
      shipping_minor,
      total_minor,
      created_at,
      orders!inner(
        order_number, 
        shipping_address,
        payment_method
      ),
      order_items(
        id,
        product_title,
        variant_attributes,
        unit_price_minor,
        quantity,
        line_total_minor
      )
    `
    )
    .eq("id", subOrderId)
    .eq("seller_id", seller.id)
    .single();

  if (error || !data) {
    throw new Error("Order not found or unauthorized");
  }

  type OrderDetailRow = {
    id: string;
    status: string;
    subtotal_minor: number;
    shipping_minor: number;
    total_minor: number;
    created_at: string;
    orders: {
      order_number: string;
      shipping_address: Record<string, string>;
      payment_method: string;
    };
    order_items: Array<{
      id: string;
      product_title: string;
      variant_attributes: Record<string, string>;
      unit_price_minor: number;
      quantity: number;
      line_total_minor: number;
    }>;
  };

  const so = data as unknown as OrderDetailRow;
  const address = so.orders.shipping_address;

  // Privacy rule: full shipping address & phone shown only from 'confirmed' onwards.
  const showFullAddress = ["confirmed", "packed", "ready_to_ship", "shipped", "delivered"].includes(so.status);

  return {
    id: so.id,
    orderNumber: so.orders.order_number,
    date: so.created_at,
    status: so.status,
    subtotalMinor: so.subtotal_minor,
    shippingMinor: so.shipping_minor,
    totalMinor: so.total_minor,
    paymentMethod: so.orders.payment_method,
    sellerBusinessName: seller.business_name,
    items: so.order_items,
    shippingAddress: {
      fullName: address.full_name,
      city: address.city,
      province: address.province,
      ...(showFullAddress && {
        phone: address.phone,
        area: address.area,
        street: address.street,
        postalCode: address.postal_code,
      }),
    },
  };
}
