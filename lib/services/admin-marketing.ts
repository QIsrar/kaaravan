/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import type { Database } from "@/lib/types/database";

export async function listAdminCoupons(adminId: string, adminRole: string) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_promotions");
  if (!hasPerm) {
    throw new Error("Access denied: manage_promotions permission required");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("coupons")
    .select("id, code, discount_type, percent_bps, fixed_pkr, min_order_pkr, max_discount_pkr, starts_at, ends_at, usage_limit, used_count, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list coupons:", error.message);
    throw new Error("Failed to load coupons");
  }

  return data ?? [];
}

export type AdminCouponListItem = Awaited<ReturnType<typeof listAdminCoupons>>[number];

export async function createAdminCoupon(
  input: {
    code: string;
    discountType: Database["public"]["Enums"]["coupon_discount_type"];
    discountValue: number;
    minOrderAmountPkr?: number;
    minOrderAmountMinor?: number;
    maxDiscountPkr?: number | null;
    maxDiscountMinor?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    usageLimit?: number | null;
    isActive?: boolean;
  },
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true; couponId: string }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_promotions");
  if (!hasPerm) {
    throw new Error("Access denied: manage_promotions permission required");
  }

  const adminClient = createAdminClient();

  const isPercent = input.discountType === "percent";
  const { data, error } = await adminClient
    .from("coupons")
    .insert({
      code: input.code.trim().toUpperCase(),
      discount_type: input.discountType,
      percent_bps: isPercent ? input.discountValue : null,
      fixed_pkr: !isPercent ? input.discountValue : null,
      min_order_pkr: input.minOrderAmountPkr ?? input.minOrderAmountMinor ?? null,
      max_discount_pkr: input.maxDiscountPkr ?? input.maxDiscountMinor ?? null,
      starts_at: input.startDate || new Date().toISOString(),
      ends_at: input.endDate ?? null,
      usage_limit: input.usageLimit ?? null,
      is_active: input.isActive ?? true,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create coupon:", error?.message);
    throw new Error("Failed to create coupon");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "COUPON_CREATED",
    entity: "coupons",
    entity_id: data.id,
    before: null,
    after: { code: input.code, discountValue: input.discountValue },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for coupon creation:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true, couponId: data.id };
}

export async function toggleCouponActive(
  couponId: string,
  isActive: boolean,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_promotions");
  if (!hasPerm) {
    throw new Error("Access denied: manage_promotions permission required");
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("coupons")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", couponId);

  if (error) {
    console.error("Failed to toggle coupon status:", error.message);
    throw new Error("Failed to update coupon status");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "COUPON_STATUS_TOGGLED",
    entity: "coupons",
    entity_id: couponId,
    before: { is_active: !isActive },
    after: { is_active: isActive },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for coupon status:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}
