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
