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
  sellerId: string,
  docType: string,
  file: File,
  actorId: string
) {
  const supabase = createAdminClient();

  const validatedDocType = docTypeSchema.safeParse(docType);
  if (!validatedDocType.success) {
    throw new Error("Invalid document type");
  }

  // Validate owner
  const { data: seller, error: fetchError } = await supabase
    .from("sellers")
    .select("owner_profile_id, status")
    .eq("id", sellerId)
    .single();

  if (fetchError || !seller || seller.owner_profile_id !== actorId) {
    throw new Error("Unauthorized to upload documents for this seller");
  }

  if (seller.status !== "pending" && seller.status !== "approved") {
    throw new Error("Cannot upload documents for this seller status");
  }

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
  const { error: dbError } = await supabase
    .from("seller_documents")
    .insert({
      seller_id: sellerId,
      doc_type: docType,
      file_path: fullPath,
      status: "pending"
    });

  if (dbError) {
    // DB error after upload, delete the uploaded file
    await supabase.storage.from(bucket).remove([objectPath]);
    throw new Error(`Failed to record document: ${dbError.message}`);
  }

  return { success: true, filePath: fullPath };
}
