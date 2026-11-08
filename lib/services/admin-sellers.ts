/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import type { Database } from "@/lib/types/database";

type SellerRow = Database["public"]["Tables"]["sellers"]["Row"];

export async function approveSeller(
  sellerId: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_sellers");
  if (!hasPerm) {
    throw new Error("Access denied: manage_sellers permission required");
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient.rpc("approve_seller", {
    p_seller_id: sellerId,
    p_admin_id: adminId,
    p_ip_address: ipAddress,
  });

  if (error) {
    console.error("Failed to approve seller:", error.message);
    throw new Error("Failed to approve seller application");
  }

  return { success: true };
}

export async function rejectSeller(
  sellerId: string,
  reason: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_sellers");
  if (!hasPerm) {
    throw new Error("Access denied: manage_sellers permission required");
  }

  const adminClient = createAdminClient();

  // Fetch current seller state for audit logging
  const { data: seller, error: fetchErr } = await adminClient
    .from("sellers")
    .select("id, status, status_reason")
    .eq("id", sellerId)
    .single();

  if (fetchErr || !seller) {
    throw new Error("Seller not found");
  }

  const beforeStatus = seller.status;

  const { error: updateErr } = await adminClient
    .from("sellers")
    .update({
      status: "rejected",
      status_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sellerId);

  if (updateErr) {
    console.error("Failed to reject seller:", updateErr.message);
    throw new Error("Failed to reject seller application");
  }

  // Audit log
  const { error: auditErr } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "SELLER_REJECTED",
    entity: "sellers",
    entity_id: sellerId,
    before: { status: beforeStatus, status_reason: seller.status_reason },
    after: { status: "rejected", status_reason: reason },
    ip: ipAddress,
  });

  if (auditErr) {
    console.error("Failed to log seller rejection:", auditErr.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

export async function suspendSeller(
  sellerId: string,
  reason: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_sellers");
  if (!hasPerm) {
    throw new Error("Access denied: manage_sellers permission required");
  }

  const adminClient = createAdminClient();

  const { data: seller, error: fetchErr } = await adminClient
    .from("sellers")
    .select("id, status, status_reason")
    .eq("id", sellerId)
    .single();

  if (fetchErr || !seller) {
    throw new Error("Seller not found");
  }

  const beforeStatus = seller.status;

  const { error: updateErr } = await adminClient
    .from("sellers")
    .update({
      status: "suspended",
      status_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sellerId);

  if (updateErr) {
    console.error("Failed to suspend seller:", updateErr.message);
    throw new Error("Failed to suspend seller");
  }

  // Audit log
  const { error: auditErr } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "SELLER_SUSPENDED",
    entity: "sellers",
    entity_id: sellerId,
    before: { status: beforeStatus, status_reason: seller.status_reason },
    after: { status: "suspended", status_reason: reason },
    ip: ipAddress,
  });

  if (auditErr) {
    console.error("Failed to log seller suspension:", auditErr.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

export async function unsuspendSeller(
  sellerId: string,
  reason: string | undefined,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_sellers");
  if (!hasPerm) {
    throw new Error("Access denied: manage_sellers permission required");
  }

  const adminClient = createAdminClient();

  const { data: seller, error: fetchErr } = await adminClient
    .from("sellers")
    .select("id, status, status_reason")
    .eq("id", sellerId)
    .single();

  if (fetchErr || !seller) {
    throw new Error("Seller not found");
  }

  const beforeStatus = seller.status;

  const { error: updateErr } = await adminClient
    .from("sellers")
    .update({
      status: "approved",
      status_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sellerId);

  if (updateErr) {
    console.error("Failed to unsuspend seller:", updateErr.message);
    throw new Error("Failed to unsuspend seller");
  }

  // Audit log
  const { error: auditErr } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "SELLER_UNSUSPENDED",
    entity: "sellers",
    entity_id: sellerId,
    before: { status: beforeStatus, status_reason: seller.status_reason },
    after: { status: "approved", status_reason: null, note: reason ?? null },
    ip: ipAddress,
  });

  if (auditErr) {
    console.error("Failed to log seller unsuspension:", auditErr.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

export async function setSellerCommission(
  sellerId: string,
  commissionRateBps: number | null,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_sellers");
  if (!hasPerm) {
    throw new Error("Access denied: manage_sellers permission required");
  }

  const adminClient = createAdminClient();

  const { data: seller, error: fetchErr } = await adminClient
    .from("sellers")
    .select("id, commission_rate_bps")
    .eq("id", sellerId)
    .single();

  if (fetchErr || !seller) {
    throw new Error("Seller not found");
  }

  const beforeRate = seller.commission_rate_bps;

  const { error: updateErr } = await adminClient
    .from("sellers")
    .update({
      commission_rate_bps: commissionRateBps,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sellerId);

  if (updateErr) {
    console.error("Failed to update commission rate:", updateErr.message);
    throw new Error("Failed to update seller commission rate");
  }

  // Audit log
  const { error: auditErr } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "SELLER_COMMISSION_UPDATED",
    entity: "sellers",
    entity_id: sellerId,
    before: { commission_rate_bps: beforeRate },
    after: { commission_rate_bps: commissionRateBps },
    ip: ipAddress,
  });

  if (auditErr) {
    console.error("Failed to log commission rate update:", auditErr.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

export async function getSellerKycDocumentSignedUrl(
  filePath: string,
  adminId: string,
  adminRole: string
): Promise<{ signedUrl: string }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_sellers");
  if (!hasPerm) {
    throw new Error("Access denied: manage_sellers permission required");
  }

  const adminClient = createAdminClient();

  // Strip leading bucket name if present
  let cleanPath = filePath;
  if (cleanPath.startsWith("seller-documents/")) {
    cleanPath = cleanPath.replace(/^seller-documents\//, "");
  }

  // Expire in 300 seconds (<= 5 min)
  const { data, error } = await adminClient.storage
    .from("seller-documents")
    .createSignedUrl(cleanPath, 300);

  if (error || !data?.signedUrl) {
    console.error("Failed to generate signed document URL:", error?.message);
    throw new Error("Failed to generate secure document URL");
  }

  return { signedUrl: data.signedUrl };
}

export async function listAdminSellers(
  adminId: string,
  adminRole: string,
  filters?: { status?: SellerRow["status"] }
) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_sellers");
  if (!hasPerm) {
    throw new Error("Access denied: manage_sellers permission required");
  }

  const adminClient = createAdminClient();

  let query = adminClient
    .from("sellers")
    .select(`
      id,
      business_name,
      slug,
      business_type,
      status,
      status_reason,
      commission_rate_bps,
      created_at,
      owner_profile_id,
      profiles:owner_profile_id (
        full_name,
        phone
      ),
      seller_kyc (
        cnic_number,
        ntn
      ),
      seller_bank_accounts (
        bank_name,
        account_title,
        iban
      ),
      seller_documents (
        id,
        doc_type,
        file_path,
        status
      )
    `)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to list sellers for admin:", error.message);
    throw new Error("Failed to retrieve sellers list");
  }

  return (data ?? []).map((row) => ({
    ...row,
    seller_bank_accounts: (row.seller_bank_accounts || []).map((b) => ({
      ...b,
      iban: b.iban ? "****" + b.iban.slice(-4) : "",
      ibanMasked: b.iban ? "****" + b.iban.slice(-4) : "",
    })),
  }));
}

export type AdminSellerListItem = Awaited<ReturnType<typeof listAdminSellers>>[number];

export async function getAdminSellerDetail(
  sellerId: string,
  adminId: string,
  adminRole: string
) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_sellers");
  if (!hasPerm) {
    throw new Error("Access denied: manage_sellers permission required");
  }

  const adminClient = createAdminClient();

  const { data: seller, error } = await adminClient
    .from("sellers")
    .select(`
      id,
      business_name,
      slug,
      business_type,
      description,
      status,
      status_reason,
      commission_rate_bps,
      created_at,
      updated_at,
      owner_profile_id,
      profiles:owner_profile_id (
        full_name,
        phone
      ),
      seller_kyc (
        cnic_number,
        ntn
      ),
      seller_bank_accounts (
        bank_name,
        account_title,
        iban,
        is_verified
      ),
      seller_documents (
        id,
        doc_type,
        file_path,
        status,
        created_at
      )
    `)
    .eq("id", sellerId)
    .single();

  if (error || !seller) {
    console.error("Failed to fetch seller detail for admin:", error?.message);
    throw new Error("Seller not found");
  }

  // Generate signed URLs for KYC documents (<= 5 min)
  const documentsWithSignedUrls = await Promise.all(
    (seller.seller_documents || []).map(async (doc) => {
      try {
        let cleanPath = doc.file_path;
        if (cleanPath.startsWith("seller-documents/")) {
          cleanPath = cleanPath.replace(/^seller-documents\//, "");
        }
        const { data: signData } = await adminClient.storage
          .from("seller-documents")
          .createSignedUrl(cleanPath, 300);

        return {
          ...doc,
          signedUrl: signData?.signedUrl ?? null,
        };
      } catch (e) {
        console.error(`Failed to generate signed URL for document ${doc.id}:`, e);
        return {
          ...doc,
          signedUrl: null,
        };
      }
    })
  );

  return {
    ...seller,
    seller_bank_accounts: (seller.seller_bank_accounts || []).map((b) => ({
      ...b,
      iban: b.iban ? "****" + b.iban.slice(-4) : "",
      ibanMasked: b.iban ? "****" + b.iban.slice(-4) : "",
    })),
    seller_documents: documentsWithSignedUrls,
  };
}

