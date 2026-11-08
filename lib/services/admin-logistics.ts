/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import type { Database, Json } from "@/lib/types/database";

export async function listAdminCouriers(adminId: string, adminRole: string) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_logistics");
  if (!hasPerm) {
    throw new Error("Access denied: manage_logistics permission required");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("couriers")
    .select("id, code, name, is_active, supports_cod, config, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to list couriers:", error.message);
    throw new Error("Failed to load couriers list");
  }

  return data ?? [];
}

export type AdminCourierListItem = Awaited<ReturnType<typeof listAdminCouriers>>[number];

export async function updateCourierConfig(
  courierCode: string,
  input: {
    isActive?: boolean;
    supportsCod?: boolean;
    rateCard?: {
      baseRateMinor?: number;
      perKgMinor?: number;
      expressRateMinor?: number;
      fuelSurchargePercent?: number;
    };
  },
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_logistics");
  if (!hasPerm) {
    throw new Error("Access denied: manage_logistics permission required");
  }

  const adminClient = createAdminClient();

  const { data: before, error: fetchErr } = await adminClient
    .from("couriers")
    .select("is_active, supports_cod, config")
    .eq("code", courierCode)
    .single();

  if (fetchErr || !before) {
    throw new Error("Courier not found");
  }

  const currentConfig = (before.config as Record<string, unknown>) || {};
  const updatedConfig = {
    ...currentConfig,
    ...(input.rateCard ? { rate_card: input.rateCard } : {}),
  };

  const updatePayload: Database["public"]["Tables"]["couriers"]["Update"] = {
    config: updatedConfig as Json,
    updated_at: new Date().toISOString(),
  };

  if (input.isActive !== undefined) updatePayload.is_active = input.isActive;
  if (input.supportsCod !== undefined) updatePayload.supports_cod = input.supportsCod;

  const { error: updateErr } = await adminClient
    .from("couriers")
    .update(updatePayload)
    .eq("code", courierCode);

  if (updateErr) {
    console.error("Failed to update courier:", updateErr.message);
    throw new Error("Failed to update courier configuration");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "COURIER_CONFIG_UPDATED",
    entity: "couriers",
    entity_id: courierCode,
    before,
    after: updatePayload,
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for courier config:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}
