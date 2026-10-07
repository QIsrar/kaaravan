/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

"use server";

import { uploadSellerDocument } from "@/lib/services/seller-documents";
import { requireAuth } from "@/lib/auth/roles";

export async function uploadSellerDocumentAction(formData: FormData) {
  try {
    const profile = await requireAuth();
    
    const sellerId = formData.get("sellerId") as string;
    const docType = formData.get("docType") as string;
    const file = formData.get("file") as File;

    if (!sellerId || !docType || !file) {
      throw new Error("Missing required fields");
    }

    const result = await uploadSellerDocument(sellerId, docType, file, profile.id);
    return { success: true, filePath: result.filePath };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getSellerDocumentsAction(sellerId: string) {
  const profile = await requireAuth();
  
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  
  // Verify ownership
  const { data: seller } = await supabase
    .from("sellers")
    .select("owner_profile_id")
    .eq("id", sellerId)
    .single();
    
  if (!seller || seller.owner_profile_id !== profile.id) {
    throw new Error("Unauthorized to view these documents");
  }

  const { data: documents, error } = await supabase
    .from("seller_documents")
    .select("id, doc_type, file_path, status, created_at")
    .eq("seller_id", sellerId);

  if (error || !documents) return [];

  // Get signed URLs for each document (1 hour expiry)
  const docsWithUrls = await Promise.all(
    documents.map(async (doc) => {
      // Remove 'seller-documents/' prefix from file_path because the bucket name is specified in .from()
      const objectPath = doc.file_path.replace("seller-documents/", "");
      const { data } = await supabase.storage
        .from("seller-documents")
        .createSignedUrl(objectPath, 3600);
        
      return {
        ...doc,
        url: data?.signedUrl || null,
      };
    })
  );

  return docsWithUrls;
}
