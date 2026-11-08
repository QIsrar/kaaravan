/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";

export async function listAdminAuditLogs(
  adminRole: string,
  filters?: {
    entity?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }
) {
  if (adminRole !== "superadmin" && adminRole !== "admin_staff") {
    throw new Error("Access denied");
  }

  const adminClient = createAdminClient();

  let query = adminClient
    .from("audit_logs")
    .select(`
      id,
      actor_id,
      action,
      entity,
      entity_id,
      before,
      after,
      ip,
      created_at,
      profiles:actor_id (
        id,
        full_name,
        role
      )
    `)
    .order("created_at", { ascending: false });

  if (filters?.entity) {
    query = query.eq("entity", filters.entity);
  }
  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error("Failed to list audit logs:", error.message);
    throw new Error("Failed to load audit logs");
  }

  return data ?? [];
}

export type AdminAuditLogItem = Awaited<ReturnType<typeof listAdminAuditLogs>>[number];
