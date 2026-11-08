/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import type { Json } from "@/lib/types/database";

export async function listAdminSettings(adminId: string, adminRole: string) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_settings");
  if (!hasPerm) {
    throw new Error("Access denied: manage_settings permission required");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("settings")
    .select("key, value, is_public, updated_at")
    .order("key", { ascending: true });

  if (error) {
    console.error("Failed to list settings:", error.message);
    throw new Error("Failed to load platform settings");
  }

  return data ?? [];
}

export type AdminSettingListItem = Awaited<ReturnType<typeof listAdminSettings>>[number];

export async function updateAdminSetting(
  key: string,
  input: {
    value?: unknown;
    isPublic?: boolean;
  },
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_settings");
  if (!hasPerm) {
    throw new Error("Access denied: manage_settings permission required");
  }

  const adminClient = createAdminClient();

  const { data: before, error: fetchErr } = await adminClient
    .from("settings")
    .select("key, value, is_public")
    .eq("key", key)
    .single();

  if (fetchErr || !before) {
    throw new Error("Setting not found");
  }

  const updateData: {
    value?: Json;
    is_public?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.value !== undefined) updateData.value = input.value as Json;
  if (input.isPublic !== undefined) updateData.is_public = input.isPublic;

  const { error } = await adminClient
    .from("settings")
    .update(updateData)
    .eq("key", key);

  if (error) {
    console.error("Failed to update setting:", error.message);
    throw new Error("Failed to update platform setting");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "SETTING_UPDATED",
    entity: "settings",
    entity_id: key,
    before,
    after: updateData,
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for setting update:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}
