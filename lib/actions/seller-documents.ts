/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

"use server";

import { uploadSellerDocument } from "@/lib/services/seller-documents";
import { requireAuth } from "@/lib/auth/roles";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/utils";

export async function uploadSellerDocumentAction(formData: FormData) {
  try {
    const profile = await requireAuth();
    
    const docType = formData.get("docType") as string;
    const file = formData.get("file") as File;

    if (!docType || !file) {
      throw new Error("Missing required fields");
    }

    const headersList = await headers();
    const ip = getClientIp(headersList);

    const result = await uploadSellerDocument(docType, file, profile.id, ip);
    return { success: true, filePath: result.filePath };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getSellerDocumentsAction() {
  const profile = await requireAuth();
  
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  
  // Verify ownership and get sellerId
  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("owner_profile_id", profile.id)
    .single();
    
  if (!seller) {
    throw new Error("Unauthorized to view these documents");
  }

  const { data: documents, error } = await supabase
    .from("seller_documents")
    .select("id, doc_type, file_path, status, created_at")
    .eq("seller_id", seller.id);

  if (error || !documents) return [];

  // Get signed URLs for each document (1 hour expiry)
  const docsWithUrls = await Promise.all(
    documents.map(async (doc) => {
      // Remove 'seller-documents/' prefix from file_path because the bucket name is specified in .from()
      const objectPath = doc.file_path.replace("seller-documents/", "");
      const { data } = await supabase.storage
        .from("seller-documents")
        .createSignedUrl(objectPath, 300); // 5 minutes
        
      return {
        ...doc,
        url: data?.signedUrl || null,
      };
    })
  );

  return docsWithUrls;
}
