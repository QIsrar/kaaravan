"use server";

/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelSubOrder, requestReturn, lookupGuestOrder } from "@/lib/services/customer_orders";
import { requireAuth } from "@/lib/auth/roles";
import { z } from "zod";
import { guestOrderLookupSchema } from "@/lib/validators/order";

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const cancelSchema = z.object({
  subOrderId: z.string().regex(uuidRegex, "Invalid order ID"),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason must not exceed 500 characters")
});

export async function cancelSubOrderAction(subOrderId: string, reason: string) {
  const parsed = cancelSchema.parse({ subOrderId, reason });
  const profile = await requireAuth();
  const supabase = await createClient();
  
  await cancelSubOrder(supabase, profile.id, parsed.subOrderId, parsed.reason);
  
  revalidatePath("/account/orders", "page");
  revalidatePath("/account/orders/[id]", "page");
}

const returnSchema = z.object({
  subOrderId: z.string().regex(uuidRegex, "Invalid order ID"),
  orderItemId: z.string().regex(uuidRegex, "Invalid item ID"),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason must not exceed 500 characters"),
  quantity: z.number().int().min(1, "Quantity must be at least 1")
});

export async function requestReturnAction(formData: FormData) {
  const parsed = returnSchema.parse({
    subOrderId: formData.get("subOrderId"),
    orderItemId: formData.get("orderItemId"),
    reason: formData.get("reason"),
    quantity: Number(formData.get("quantity"))
  });

  const files = formData.getAll("evidenceFiles") as File[];
  
  const profile = await requireAuth();
  const supabase = await createClient();
  
  await requestReturn(supabase, profile.id, parsed.subOrderId, parsed.orderItemId, parsed.reason, parsed.quantity, files);
  
  revalidatePath("/account/orders", "page");
  revalidatePath("/account/orders/[id]", "page");
}

export async function lookupGuestOrderAction(orderNumber: string, email: string) {
  const parsed = guestOrderLookupSchema.safeParse({ orderNumber, email });
  if (!parsed.success) {
    throw new Error("Order not found");
  }

  const adminClient = createAdminClient();
  return await lookupGuestOrder(adminClient, parsed.data.orderNumber, parsed.data.email);
}
