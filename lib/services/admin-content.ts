/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";
import { bannerSchema, type BannerInput } from "@/lib/validators/admin";
import type { Database } from "@/lib/types/database";

export async function uploadBannerImage(
  file: File,
  adminId: string,
  adminRole: string
): Promise<{ success: true; imagePath: string }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_content");
  if (!hasPerm) {
    throw new Error("Access denied: manage_content permission required");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Banner image must be smaller than 5MB");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG, PNG, and WebP images are supported");
  }

  const adminClient = createAdminClient();
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "webp";
  const randomUuid = crypto.randomUUID();
  const objectPath = `hero/${randomUuid}.${fileExt}`;

  const { error: uploadErr } = await adminClient.storage
    .from("banners")
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    console.error("Failed to upload banner image:", uploadErr.message);
    throw new Error("Failed to upload banner image");
  }

  const fullPath = `banners/${objectPath}`;
  return { success: true, imagePath: fullPath };
}

export async function createBanner(
  input: BannerInput,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true; bannerId: string }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_content");
  if (!hasPerm) {
    throw new Error("Access denied: manage_content permission required");
  }

  const validated = bannerSchema.parse(input);
  const adminClient = createAdminClient();

  const { data: inserted, error: insertErr } = await adminClient
    .from("banners")
    .insert({
      title: validated.titleEn || validated.titleUr || "",
      title_en: validated.titleEn ?? null,
      title_ur: validated.titleUr ?? null,
      subtitle_en: validated.subtitleEn ?? null,
      subtitle_ur: validated.subtitleUr ?? null,
      tag_en: validated.tagEn ?? null,
      tag_ur: validated.tagUr ?? null,
      image_url: validated.imageUrl,
      link_url: validated.linkUrl ?? null,
      sort_order: validated.sortOrder,
      is_active: validated.isActive,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("Failed to create banner:", insertErr?.message);
    throw new Error("Failed to create banner");
  }

  // Audit log
  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "BANNER_CREATED",
    entity: "banners",
    entity_id: inserted.id,
    before: null,
    after: validated,
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for banner creation:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true, bannerId: inserted.id };
}

export async function updateBanner(
  bannerId: string,
  input: Partial<BannerInput>,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_content");
  if (!hasPerm) {
    throw new Error("Access denied: manage_content permission required");
  }

  const adminClient = createAdminClient();

  const { data: before, error: fetchErr } = await adminClient
    .from("banners")
    .select("*")
    .eq("id", bannerId)
    .single();

  if (fetchErr || !before) {
    throw new Error("Banner not found");
  }

  const updatePayload: Database["public"]["Tables"]["banners"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (input.titleEn !== undefined) {
    updatePayload.title_en = input.titleEn;
    updatePayload.title = input.titleEn || before.title;
  }
  if (input.titleUr !== undefined) updatePayload.title_ur = input.titleUr;
  if (input.subtitleEn !== undefined) updatePayload.subtitle_en = input.subtitleEn;
  if (input.subtitleUr !== undefined) updatePayload.subtitle_ur = input.subtitleUr;
  if (input.tagEn !== undefined) updatePayload.tag_en = input.tagEn;
  if (input.tagUr !== undefined) updatePayload.tag_ur = input.tagUr;
  if (input.imageUrl !== undefined) updatePayload.image_url = input.imageUrl;
  if (input.linkUrl !== undefined) updatePayload.link_url = input.linkUrl;
  if (input.sortOrder !== undefined) updatePayload.sort_order = input.sortOrder;
  if (input.isActive !== undefined) updatePayload.is_active = input.isActive;

  const { error: updateErr } = await adminClient
    .from("banners")
    .update(updatePayload)
    .eq("id", bannerId);

  if (updateErr) {
    console.error("Failed to update banner:", updateErr.message);
    throw new Error("Failed to update banner");
  }

  // Audit log
  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "BANNER_UPDATED",
    entity: "banners",
    entity_id: bannerId,
    before,
    after: updatePayload,
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for banner update:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

export async function deleteBanner(
  bannerId: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_content");
  if (!hasPerm) {
    throw new Error("Access denied: manage_content permission required");
  }

  const adminClient = createAdminClient();

  const { data: before, error: fetchErr } = await adminClient
    .from("banners")
    .select("*")
    .eq("id", bannerId)
    .single();

  if (fetchErr || !before) {
    throw new Error("Banner not found");
  }

  const { error: deleteErr } = await adminClient
    .from("banners")
    .delete()
    .eq("id", bannerId);

  if (deleteErr) {
    console.error("Failed to delete banner:", deleteErr.message);
    throw new Error("Failed to delete banner");
  }

  // Audit log
  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "BANNER_DELETED",
    entity: "banners",
    entity_id: bannerId,
    before,
    after: null,
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for banner deletion:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

export async function listAdminBanners(
  adminId: string,
  adminRole: string
) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_content");
  if (!hasPerm) {
    throw new Error("Access denied: manage_content permission required");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("banners")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to list banners:", error.message);
    throw new Error("Failed to load banners");
  }

  return data ?? [];
}

export type AdminBannerListItem = Awaited<ReturnType<typeof listAdminBanners>>[number];

