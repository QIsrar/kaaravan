/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const docTypeSchema = z.enum([
  "cnic_front",
  "cnic_back",
  "ntn_certificate",
  "business_registration",
  "other"
]);

export async function uploadSellerDocument(
  docType: string,
  file: File,
  actorId: string,
  ip: string
) {
  const supabase = createAdminClient();

  const validatedDocType = docTypeSchema.safeParse(docType);
  if (!validatedDocType.success) {
    throw new Error("Invalid document type");
  }

  // Find the seller by owner_profile_id
  const { data: seller, error: fetchError } = await supabase
    .from("sellers")
    .select("id, owner_profile_id, status")
    .eq("owner_profile_id", actorId)
    .single();

  if (fetchError || !seller) {
    throw new Error("Unauthorized to upload documents for this seller");
  }

  if (seller.status !== "pending" && seller.status !== "approved") {
    throw new Error("Cannot upload documents for this seller status");
  }
  
  const sellerId = seller.id;

  // Check file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File must be smaller than 5MB");
  }

  // Check file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed");
  }

  const nameParts = file.name.split(".");
  const ext = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : "bin";
  const finalExt = ext && ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext) ? ext : "bin";

  const randomUuid = crypto.randomUUID();
  const bucket = "seller-documents";
  const objectPath = `${sellerId}/${docType}/${randomUuid}.${finalExt}`;
  const fullPath = `${bucket}/${objectPath}`; // "seller-documents/<seller_id>/<doc_type>/<random-uuid>.<ext>"

  // Upload to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload document: ${uploadError.message}`);
  }

  // Insert seller_documents record
  const { data: document, error: dbError } = await supabase
    .from("seller_documents")
    .insert({
      seller_id: sellerId,
      doc_type: docType,
      file_path: fullPath,
      status: "pending"
    })
    .select()
    .single();

  if (dbError) {
    // DB error after upload, delete the uploaded file
    await supabase.storage.from(bucket).remove([objectPath]);
    throw new Error(`Failed to record document: ${dbError.message}`);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action: "SELLER_DOCUMENT_UPLOADED",
    entity: "seller_documents",
    entity_id: document.id,
    before: null,
    after: { doc_type: docType, file_path: fullPath },
    ip: ip
  });

  if (auditError) {
    console.error("Failed to insert audit log:", auditError.message);
    throw new Error("Failed to record document upload audit log");
  }

  return { success: true, filePath: fullPath };
}
