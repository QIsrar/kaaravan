import React from "react";
import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  ReviewsManager,
  type DeliveredOrderItem,
  type UserReview,
} from "@/components/store/reviews-manager";

export default async function CustomerReviewsPage() {
  const profile = await requireAuth(["customer", "seller", "superadmin"]);
  const supabase = await createClient();

  // 1. Fetch user reviews and delivered order items concurrently
  const [{ data: rawReviews }, { data: rawOrders }] = await Promise.all([
    supabase
      .from("reviews")
      .select(`
        id, product_id, order_item_id, rating, title, body, status, created_at,
        products (title, slug, product_images (path))
      `)
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(`
        id, order_number, placed_at,
        sub_orders (
          id, status, updated_at,
          order_items (
            id, sub_order_id, variant_id, product_title, created_at,
            product_variants (
              products (id, title, slug, product_images (path))
            )
          )
        )
      `)
      .eq("profile_id", profile.id)
      .is("deleted_at", null),
  ]);

  const reviewedOrderItemIds = new Set(
    (rawReviews || []).map((r) => r.order_item_id).filter(Boolean)
  );

  const unreviewedItems: DeliveredOrderItem[] = [];

  for (const order of rawOrders || []) {
    for (const sub of order.sub_orders || []) {
      if (sub.status === "delivered") {
        for (const item of sub.order_items || []) {
          if (!reviewedOrderItemIds.has(item.id)) {
            const prod = item.product_variants?.products;
            if (prod) {
              unreviewedItems.push({
                orderItemId: item.id,
                subOrderId: sub.id,
                orderNumber: order.order_number,
                productId: prod.id,
                productTitle: prod.title || item.product_title,
                productSlug: prod.slug,
                productImage: prod.product_images?.[0]?.path || "/placeholder-product.svg",
                deliveredDate: sub.updated_at,
              });
            }
          }
        }
      }
    }
  }

  const userReviews: UserReview[] = (rawReviews || []).map((r) => ({
    id: r.id,
    productId: r.product_id,
    orderItemId: r.order_item_id || "",
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status as "pending" | "published" | "rejected",
    createdAt: r.created_at,
    productTitle: r.products?.title || "Craft Product",
    productSlug: r.products?.slug || "",
    productImage: r.products?.product_images?.[0]?.path || "/placeholder-product.svg",
  }));

  return (
    <ReviewsManager
      initialUnreviewed={unreviewedItems}
      initialReviews={userReviews}
    />
  );
}
