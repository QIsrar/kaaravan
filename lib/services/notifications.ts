/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";

export type CancellationActor = "customer" | "seller" | "admin" | "system";

export interface OrderCancellationNotificationParams {
  orderNumber: string;
  subOrderId: string;
  sellerId: string;
  customerProfileId?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  cancelledBy: CancellationActor;
  reason: string;
}

export interface NotificationResult {
  delivered: boolean;
  channels: string[];
}

/**
 * Dispatches notification stub across customer, seller, and admin cancellation paths.
 * Logs structured channel dispatch and persists in-app notification rows to the database.
 */
export async function notifyOrderCancellation(
  params: OrderCancellationNotificationParams
): Promise<NotificationResult> {
  const adminClient = createAdminClient();
  const channels: string[] = ["console_stub"];

  // 1. Fetch merchant owner profile for in-app alert
  const { data: seller } = await adminClient
    .from("sellers")
    .select("owner_profile_id, business_name")
    .eq("id", params.sellerId)
    .single();

  const sellerName = seller?.business_name || "Merchant";

  // 2. Notification Dispatch by Actor
  switch (params.cancelledBy) {
    case "customer": {
      // Notify Merchant
      console.info(
        `[Cancellation Notification Stub] [Customer Cancelled] Merchant '${sellerName}' (${params.sellerId}) notified: Customer cancelled sub-order ${params.subOrderId} for order ${params.orderNumber}. Reason: "${params.reason}" (Channels: SMS, Push)`
      );
      channels.push("merchant_sms_stub", "merchant_push_stub");

      if (seller?.owner_profile_id) {
        await adminClient.from("notifications").insert({
          profile_id: seller.owner_profile_id,
          type: "order_cancelled_by_customer",
          payload: {
            orderNumber: params.orderNumber,
            subOrderId: params.subOrderId,
            reason: params.reason,
            timestamp: new Date().toISOString(),
          },
        });
      }
      break;
    }

    case "seller": {
      // Notify Customer
      const customerContact = params.customerEmail || params.customerPhone || params.customerProfileId || "Guest";
      console.info(
        `[Cancellation Notification Stub] [Seller Cancelled] Customer (${customerContact}) notified: Merchant '${sellerName}' cancelled sub-order ${params.subOrderId} for order ${params.orderNumber}. Reason: "${params.reason}" (Channels: WhatsApp, Email, InApp)`
      );
      channels.push("customer_whatsapp_stub", "customer_email_stub");

      if (params.customerProfileId) {
        await adminClient.from("notifications").insert({
          profile_id: params.customerProfileId,
          type: "order_cancelled_by_seller",
          payload: {
            orderNumber: params.orderNumber,
            subOrderId: params.subOrderId,
            sellerName,
            reason: params.reason,
            timestamp: new Date().toISOString(),
          },
        });
      }
      break;
    }

    case "admin": {
      // Notify Both Customer and Merchant of Administrative Override
      const customerContact = params.customerEmail || params.customerPhone || params.customerProfileId || "Customer";
      console.info(
        `[Cancellation Notification Stub] [Admin Override] Notified merchant '${sellerName}' and customer (${customerContact}): Sub-order ${params.subOrderId} for order ${params.orderNumber} cancelled by Platform Administration. Note: "${params.reason}"`
      );
      channels.push("admin_alert_stub", "customer_email_stub", "merchant_sms_stub");

      const notificationsToInsert = [];
      if (params.customerProfileId) {
        notificationsToInsert.push({
          profile_id: params.customerProfileId,
          type: "order_cancelled_by_admin",
          payload: {
            orderNumber: params.orderNumber,
            subOrderId: params.subOrderId,
            reason: params.reason,
            timestamp: new Date().toISOString(),
          },
        });
      }
      if (seller?.owner_profile_id) {
        notificationsToInsert.push({
          profile_id: seller.owner_profile_id,
          type: "order_cancelled_by_admin",
          payload: {
            orderNumber: params.orderNumber,
            subOrderId: params.subOrderId,
            reason: params.reason,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (notificationsToInsert.length > 0) {
        await adminClient.from("notifications").insert(notificationsToInsert);
      }
      break;
    }

    case "system": {
      // System Expiration (15-min online payment timeout or 24-hr unconfirmed COD)
      console.info(
        `[Cancellation Notification Stub] [System Expiry] Sub-order ${params.subOrderId} for order ${params.orderNumber} auto-cancelled by Platform System. Reason: "${params.reason}"`
      );
      channels.push("system_event_stub");

      if (params.customerProfileId) {
        await adminClient.from("notifications").insert({
          profile_id: params.customerProfileId,
          type: "order_expired_by_system",
          payload: {
            orderNumber: params.orderNumber,
            subOrderId: params.subOrderId,
            reason: params.reason,
            timestamp: new Date().toISOString(),
          },
        });
      }
      break;
    }
  }

  return { delivered: true, channels };
}

