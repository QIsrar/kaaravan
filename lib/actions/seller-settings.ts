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

export async function updateSellerSettingsAction(data: {
  description?: string;
  logo?: string;
  banner?: string;
  pickupAddress?: {
    full_name: string;
    phone: string;
    province: string;
    city: string;
    area: string;
    street: string;
    postal_code?: string;
  };
}) {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");

  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || "127.0.0.1";

  await updateSellerSettings(profile.id, ipAddress, data);
  return { success: true };
}

export async function uploadSellerLogoAction(formData: FormData) {
  const profile = await requireAuth(["seller"]);
  if (!profile) throw new Error("Unauthorized");

  const logoFile = formData.get("logo") as File | null;
  if (!logoFile) throw new Error("No logo provided");

  if (logoFile.type !== "image/webp") throw new Error("Logo must be WebP format");
  if (logoFile.size > 2 * 1024 * 1024) throw new Error("Logo must be 2MB or less");

  const supabase = createAdminClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, logo, status")
    .eq("owner_profile_id", profile.id)
    .single();

  if (!seller) throw new Error("Seller not found");
  if (seller.status !== "approved") throw new Error("Seller not approved");

  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || "127.0.0.1";

  const randomUuid = crypto.randomUUID();
  const objectPath = `seller-branding/${seller.id}/logo-${randomUuid}.webp`;

  // delete old logo
  if (seller.logo && seller.logo.startsWith("seller-branding/")) {
    await supabase.storage.from("seller-branding").remove([seller.logo.replace("seller-branding/", "")]);
  }

  const { error: uploadError } = await supabase.storage
    .from("seller-branding")
    .upload(objectPath.replace("seller-branding/", ""), logoFile, {
      contentType: "image/webp",
      upsert: true
    });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "SELLER_LOGO_UPLOADED",
    entity: "sellers",
    entity_id: seller.id,
    before: { logo: seller.logo },
    after: { logo: objectPath },
    ip: ipAddress
  });

  return { success: true, logoPath: objectPath };
}
