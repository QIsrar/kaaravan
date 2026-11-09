/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import {
  bankChangeRequestSchema,
  rejectBankTransferProofSchema,
  type BankChangeRequestInput,
} from "@/lib/validators/admin";

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

export interface AdminBankTransferProofItem {
  id: string;
  orderId: string;
  orderNumber: string;
  filePath: string;
  signedUrl: string | null;
  status: string;
  verifiedBy: string | null;
  createdAt: string;
  updatedAt: string;
  totalPkr: number;
  totalMinor: number;
  currency: string;
  paymentStatus: string;
  customer: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    isGuest: boolean;
  };
}

export async function listBankTransferProofs(
  adminId: string,
  adminRole: string,
  options?: {
    status?: "pending" | "approved" | "rejected" | "all";
    limit?: number;
    offset?: number;
  }
): Promise<AdminBankTransferProofItem[]> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_finance");
  if (!hasPerm) {
    throw new Error("Access denied: manage_finance permission required");
  }

  const adminClient = createAdminClient();
  const filterStatus = options?.status ?? "pending";
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  let query = adminClient
    .from("bank_transfer_proofs")
    .select(`
      id,
      order_id,
      file_path,
      status,
      verified_by,
      created_at,
      updated_at,
      orders (
        id,
        order_number,
        total_pkr,
        currency,
        payment_status,
        profile_id,
        guest_email,
        guest_phone
      )
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filterStatus !== "all") {
    query = query.eq("status", filterStatus);
  }

  const { data: proofs, error: queryErr } = await query;
  if (queryErr) {
    console.error("Failed to list bank transfer proofs:", queryErr.message);
    throw new Error("Failed to retrieve bank transfer proofs");
  }

  if (!proofs || proofs.length === 0) {
    return [];
  }

  // Collect profile_ids for customer names
  const profileIds = Array.from(
    new Set(
      proofs
        .map((p) => p.orders?.profile_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  const profileMap = new Map<string, { full_name: string | null; phone: string | null }>();
  if (profileIds.length > 0) {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", profileIds);

    for (const prof of profiles ?? []) {
      profileMap.set(prof.id, prof);
    }
  }

  const items: AdminBankTransferProofItem[] = [];

  for (const row of proofs) {
    const order = row.orders;
    if (!order) continue;

    // Generate signed URL (valid for 5 minutes / 300 seconds)
    let signedUrl: string | null = null;
    try {
      const cleanPath = row.file_path.replace(/^\/+/, "");
      const { data: signData } = await adminClient.storage
        .from("payment-proofs")
        .createSignedUrl(cleanPath, 300);
      signedUrl = signData?.signedUrl ?? null;
    } catch (e) {
      console.error(`Failed to generate signed URL for proof ${row.id}:`, e);
    }

    const prof = order.profile_id ? profileMap.get(order.profile_id) : null;
    const isGuest = !order.profile_id;

    items.push({
      id: row.id,
      orderId: order.id,
      orderNumber: order.order_number,
      filePath: row.file_path,
      signedUrl,
      status: row.status,
      verifiedBy: row.verified_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      totalPkr: order.total_pkr,
      totalMinor: order.total_pkr,
      currency: order.currency,
      paymentStatus: order.payment_status,
      customer: {
        fullName: prof?.full_name ?? (isGuest ? "Guest Customer" : null),
        email: order.guest_email ?? null,
        phone: prof?.phone ?? order.guest_phone ?? null,
        isGuest,
      },
    });
  }

  return items;
}

export async function approveBankTransferProof(params: {
  proofId: string;
  adminId: string;
  adminRole: string;
  ipAddress: string;
  note?: string;
}): Promise<{ success: true; orderId: string; orderNumber: string }> {
  const hasPerm = await checkAdminPermission(params.adminId, params.adminRole, "manage_finance");
  if (!hasPerm) {
    throw new Error("Access denied: manage_finance permission required");
  }

  const adminClient = createAdminClient();

  // 1. Fetch proof
  const { data: proof, error: proofErr } = await adminClient
    .from("bank_transfer_proofs")
    .select("id, order_id, status")
    .eq("id", params.proofId)
    .single();

  if (proofErr || !proof) {
    throw new Error("Bank transfer proof not found");
  }

  if (proof.status !== "pending") {
    throw new Error(`Bank transfer proof has already been processed (status: ${proof.status})`);
  }

  // 2. Fetch order
  const { data: order, error: orderErr } = await adminClient
    .from("orders")
    .select("id, order_number, payment_status, total_pkr")
    .eq("id", proof.order_id)
    .single();

  if (orderErr || !order) {
    throw new Error("Order associated with payment proof not found");
  }

  // 3. Mark proof approved
  const { error: updateProofErr } = await adminClient
    .from("bank_transfer_proofs")
    .update({
      status: "approved",
      verified_by: params.adminId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", proof.id);

  if (updateProofErr) {
    console.error("Failed to update bank transfer proof:", updateProofErr.message);
    throw new Error("Failed to update bank transfer proof status");
  }

  // 4. Atomically confirm payment and convert inventory via confirm_order_payment RPC (CRIT-04)
  const { error: confirmErr } = await adminClient.rpc("confirm_order_payment", {
    p_order_id: order.id,
    p_amount_pkr: order.total_pkr,
    p_currency: "PKR",
    p_gateway: "bank_transfer",
    p_gateway_ref: params.proofId,
    p_idempotency_key: `bank_proof_${params.proofId}`,
    p_raw_response: {
      proof_id: params.proofId,
      approved_by: params.adminId,
      note: params.note ?? null,
      approved_at: new Date().toISOString(),
    },
    p_actor_id: params.adminId,
  });

  if (confirmErr) {
    throw new Error(`Failed to confirm bank transfer payment atomically: ${confirmErr.message}`);
  }

  return { success: true, orderId: order.id, orderNumber: order.order_number };
}

export async function rejectBankTransferProof(params: {
  proofId: string;
  reason: string;
  adminId: string;
  adminRole: string;
  ipAddress: string;
}): Promise<{ success: true; orderId: string; orderNumber: string }> {
  const hasPerm = await checkAdminPermission(params.adminId, params.adminRole, "manage_finance");
  if (!hasPerm) {
    throw new Error("Access denied: manage_finance permission required");
  }

  const validated = rejectBankTransferProofSchema.parse({ reason: params.reason });
  const adminClient = createAdminClient();

  // 1. Fetch proof
  const { data: proof, error: proofErr } = await adminClient
    .from("bank_transfer_proofs")
    .select("id, order_id, status")
    .eq("id", params.proofId)
    .single();

  if (proofErr || !proof) {
    throw new Error("Bank transfer proof not found");
  }

  if (proof.status !== "pending") {
    throw new Error(`Bank transfer proof has already been processed (status: ${proof.status})`);
  }

  // 2. Fetch order
  const { data: order, error: orderErr } = await adminClient
    .from("orders")
    .select("id, order_number, payment_status")
    .eq("id", proof.order_id)
    .single();

  if (orderErr || !order) {
    throw new Error("Order associated with payment proof not found");
  }

  // 3. Mark proof rejected
  const { error: updateProofErr } = await adminClient
    .from("bank_transfer_proofs")
    .update({
      status: "rejected",
      verified_by: params.adminId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", proof.id);

  if (updateProofErr) {
    console.error("Failed to update bank transfer proof:", updateProofErr.message);
    throw new Error("Failed to reject bank transfer proof");
  }

  // 4. Update payments table
  await adminClient
    .from("payments")
    .update({
      status: "failed",
      raw_response: {
        rejected_by: params.adminId,
        reason: validated.reason,
        rejected_at: new Date().toISOString(),
      },
    })
    .eq("order_id", order.id);

  // 5. Update order payment status
  await adminClient
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("id", order.id);

  // 6. Release reserved stock back to active inventory via RPC
  const { error: releaseErr } = await adminClient.rpc("release_order_stock", {
    p_order_id: order.id,
    p_reason: `Bank transfer proof rejected: ${validated.reason}`,
    p_actor_id: params.adminId,
  });

  if (releaseErr) {
    console.error("Failed to execute release_order_stock RPC:", releaseErr.message);
  }

  // 7. Add order status history
  const { data: subOrders } = await adminClient
    .from("sub_orders")
    .select("id")
    .eq("order_id", order.id);

  if (subOrders && subOrders.length > 0) {
    const historyRows = subOrders.map((sub) => ({
      sub_order_id: sub.id,
      to_status: "cancelled" as const,
      note: `Bank transfer proof rejected: ${validated.reason}`,
      changed_by: params.adminId,
    }));

    await adminClient.from("order_status_history").insert(historyRows);
  }

  // 8. Append audit log
  await adminClient.from("audit_logs").insert({
    actor_id: params.adminId,
    action: "BANK_TRANSFER_PROOF_REJECTED",
    entity: "bank_transfer_proofs",
    entity_id: proof.id,
    before: { status: "pending" },
    after: {
      status: "rejected",
      reason: validated.reason,
      verified_by: params.adminId,
    },
    ip: params.ipAddress,
  });

  return { success: true, orderId: order.id, orderNumber: order.order_number };
}
