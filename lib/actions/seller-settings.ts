/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { requireAuth } from "@/lib/auth/roles";
import { getSellerSettings, updateSellerSettings } from "@/lib/services/seller-settings";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getSellerSettingsAction() {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");
  return getSellerSettings(profile.id);
}

export async function updateSellerSettingsAction(data: any) {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");

  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || "127.0.0.1";

  await updateSellerSettings(profile.id, ipAddress, data);
  return { success: true };
}

export async function getSellerDocumentUploadUrlAction(docType: string, extension: string) {
  const profile = await requireAuth(["seller", "customer"]);
  if (!profile) throw new Error("Unauthorized");

  const supabase = createAdminClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("owner_profile_id", profile.id)
    .single();

  if (!seller) throw new Error("Seller not found");

  const bucket = docType === "logo" ? "seller-branding" : "seller-documents";
  const randomUuid = crypto.randomUUID();
  const objectPath = `${seller.id}/${docType}/${randomUuid}.${extension}`;
  
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(objectPath);
  
  if (error || !data) throw new Error(`Failed to create upload URL: ${error?.message}`);

  return { 
    signedUrl: data.signedUrl, 
    path: data.path,
    token: data.token,
    fullPath: `${bucket}/${objectPath}`
  };
}
