/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import { bankChangeRequestSchema, type BankChangeRequestInput } from "@/lib/validators/admin";

export async function submitSellerBankChangeRequest(
  sellerId: string,
  input: BankChangeRequestInput,
  profileId: string,
  ipAddress: string
): Promise<{ success: true; requestId: string }> {
  const validated = bankChangeRequestSchema.parse(input);
  const adminClient = createAdminClient();

  // Verify caller owns this seller
  const { data: seller, error: sellerErr } = await adminClient
    .from("sellers")
    .select("id, owner_profile_id, status")
    .eq("id", sellerId)
    .single();

  if (sellerErr || !seller || seller.owner_profile_id !== profileId) {
    throw new Error("Unauthorized to submit bank change request for this seller");
  }

  // Check if a pending request already exists
  const { data: existing } = await adminClient
    .from("seller_bank_change_requests")
    .select("id")
    .eq("seller_id", sellerId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    throw new Error("A pending bank details change request is already under review");
  }

  const { data: inserted, error: insertErr } = await adminClient
    .from("seller_bank_change_requests")
    .insert({
      seller_id: sellerId,
      bank_name: validated.bankName,
      account_title: validated.accountTitle,
      iban: validated.iban,
      reason: validated.reason ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("Failed to insert bank change request:", insertErr?.message);
    throw new Error("Failed to submit bank change request");
  }

  const maskedIban = "****" + validated.iban.slice(-4);

  // Append audit log
  await adminClient.from("audit_logs").insert({
    actor_id: profileId,
    action: "SELLER_BANK_CHANGE_REQUESTED",
    entity: "seller_bank_change_requests",
    entity_id: inserted.id,
    before: null,
    after: {
      seller_id: sellerId,
      bank_name: validated.bankName,
      account_title: validated.accountTitle,
      iban_masked: maskedIban,
    },
    ip: ipAddress,
  });

  return { success: true, requestId: inserted.id };
}

export async function getSellerBankChangeStatus(sellerId: string) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("seller_bank_change_requests")
    .select("id, bank_name, account_title, iban, status, reason, created_at")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch seller bank change status:", error.message);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    ibanMasked: "****" + data.iban.slice(-4),
  };
}

export async function listBankChangeRequests(
  adminId: string,
  adminRole: string,
  status?: "pending" | "approved" | "rejected"
) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_finance");
  if (!hasPerm) {
    throw new Error("Access denied: manage_finance permission required");
  }

  const adminClient = createAdminClient();

  let query = adminClient
    .from("seller_bank_change_requests")
    .select(`
      id,
      seller_id,
      bank_name,
      account_title,
      iban,
      status,
      reviewed_by,
      reason,
      created_at,
      updated_at,
      sellers (
        business_name,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to list bank change requests:", error.message);
    throw new Error("Failed to retrieve bank change requests");
  }

  return (data ?? []).map((row) => ({
    ...row,
    ibanMasked: "****" + row.iban.slice(-4),
  }));
}

export type AdminBankChangeRequestItem = Awaited<ReturnType<typeof listBankChangeRequests>>[number];

export async function approveBankChangeRequest(
  requestId: string,
  adminId: string,
  adminRole: string,
  ipAddress: string,
  note?: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_finance");
  if (!hasPerm) {
    throw new Error("Access denied: manage_finance permission required");
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient.rpc("approve_seller_bank_change_request", {
    p_request_id: requestId,
    p_admin_id: adminId,
    p_ip_address: ipAddress,
    p_note: note ?? undefined,
  });

  if (error) {
    console.error("Failed to approve bank change request RPC:", error.message);
    throw new Error("Failed to approve bank change request");
  }

  return { success: true };
}

export async function rejectBankChangeRequest(
  requestId: string,
  reason: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_finance");
  if (!hasPerm) {
    throw new Error("Access denied: manage_finance permission required");
  }

  const adminClient = createAdminClient();

  const { data: req, error: fetchErr } = await adminClient
    .from("seller_bank_change_requests")
    .select("id, status, seller_id, iban")
    .eq("id", requestId)
    .single();

  if (fetchErr || !req) {
    throw new Error("Bank change request not found");
  }

  if (req.status !== "pending") {
    throw new Error("Request has already been processed");
  }

  const { error: updateErr } = await adminClient
    .from("seller_bank_change_requests")
    .update({
      status: "rejected",
      reviewed_by: adminId,
      reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateErr) {
    console.error("Failed to reject bank change request:", updateErr.message);
    throw new Error("Failed to reject bank change request");
  }

  const maskedIban = "****" + req.iban.slice(-4);

  // Append audit log
  await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "SELLER_BANK_CHANGE_REJECTED",
    entity: "seller_bank_change_requests",
    entity_id: requestId,
    before: { status: "pending" },
    after: { status: "rejected", reason, iban_masked: maskedIban },
    ip: ipAddress,
  });

  return { success: true };
}
