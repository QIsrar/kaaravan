/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminPermission } from "@/lib/auth/admin";

export async function listModerationQueue(
  adminId: string,
  adminRole: string,
  status: "pending_review" | "active" | "rejected" | "archived" = "pending_review"
) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("products")
    .select(`
      id,
      title,
      slug,
      description,
      status,
      rejection_reason,
      created_at,
      updated_at,
      seller_id,
      sellers (
        business_name,
        slug
      ),
      categories (
        name,
        slug
      ),
      product_variants (
        id,
        sku,
        price_pkr,
        compare_at_pkr,
        stock_quantity,
        is_active
      ),
      product_images (
        id,
        path,
        sort_order
      )
    `)
    .eq("status", status)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to list moderation queue:", error.message);
    throw new Error("Failed to load product moderation queue");
  }

  return data ?? [];
}

export type AdminProductListItem = Awaited<ReturnType<typeof listModerationQueue>>[number];

export async function approveProduct(
  productId: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  const adminClient = createAdminClient();

  const { data: product, error: fetchErr } = await adminClient
    .from("products")
    .select("status, rejection_reason")
    .eq("id", productId)
    .single();

  if (fetchErr || !product) {
    throw new Error("Product not found");
  }

  const beforeStatus = product.status;

  const { error: updateErr } = await adminClient
    .from("products")
    .update({
      status: "active",
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (updateErr) {
    console.error("Failed to approve product:", updateErr.message);
    throw new Error("Failed to approve product");
  }

  // Append audit log
  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "PRODUCT_APPROVED",
    entity: "products",
    entity_id: productId,
    before: { status: beforeStatus, rejection_reason: product.rejection_reason },
    after: { status: "active", rejection_reason: null },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for product approval:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

export async function rejectProduct(
  productId: string,
  reason: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error("Rejection reason is required");
  }

  const adminClient = createAdminClient();

  const { data: product, error: fetchErr } = await adminClient
    .from("products")
    .select("status, rejection_reason")
    .eq("id", productId)
    .single();

  if (fetchErr || !product) {
    throw new Error("Product not found");
  }

  const beforeStatus = product.status;

  const { error: updateErr } = await adminClient
    .from("products")
    .update({
      status: "rejected",
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (updateErr) {
    console.error("Failed to reject product:", updateErr.message);
    throw new Error("Failed to reject product");
  }

  // Append audit log
  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "PRODUCT_REJECTED",
    entity: "products",
    entity_id: productId,
    before: { status: beforeStatus, rejection_reason: product.rejection_reason },
    after: { status: "rejected", rejection_reason: reason },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for product rejection:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

export async function takeDownProduct(
  productId: string,
  reason: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error("Take-down reason is required");
  }

  const adminClient = createAdminClient();

  const { data: product, error: fetchErr } = await adminClient
    .from("products")
    .select("status, rejection_reason")
    .eq("id", productId)
    .single();

  if (fetchErr || !product) {
    throw new Error("Product not found");
  }

  const beforeStatus = product.status;

  const { error: updateErr } = await adminClient
    .from("products")
    .update({
      status: "archived",
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (updateErr) {
    console.error("Failed to take down product:", updateErr.message);
    throw new Error("Failed to take down product");
  }

  // Append audit log
  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "PRODUCT_TAKEN_DOWN",
    entity: "products",
    entity_id: productId,
    before: { status: beforeStatus, rejection_reason: product.rejection_reason },
    after: { status: "archived", rejection_reason: reason },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for product takedown:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

// -------------------------------------------------------------
// Category Management
// -------------------------------------------------------------

export async function listAdminCategories(adminId: string, adminRole: string) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("categories")
    .select("id, name, slug, parent_id, commission_rate_bps, sort_order, is_active, created_at, updated_at")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to list categories for admin:", error.message);
    throw new Error("Failed to list categories");
  }

  return data ?? [];
}

export async function createAdminCategory(
  input: {
    name: string;
    slug: string;
    parentId?: string | null;
    commissionRateBps?: number | null;
    sortOrder?: number;
    isActive?: boolean;
  },
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true; categoryId: string }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("categories")
    .insert({
      name: input.name,
      slug: input.slug,
      parent_id: input.parentId || null,
      commission_rate_bps: input.commissionRateBps ?? null,
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create category:", error?.message);
    throw new Error("Failed to create category");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "CATEGORY_CREATED",
    entity: "categories",
    entity_id: data.id,
    before: null,
    after: { name: input.name, slug: input.slug, commissionRateBps: input.commissionRateBps },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for category creation:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true, categoryId: data.id };
}

export async function updateAdminCategory(
  categoryId: string,
  input: {
    name?: string;
    slug?: string;
    parentId?: string | null;
    commissionRateBps?: number | null;
    sortOrder?: number;
    isActive?: boolean;
  },
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  const adminClient = createAdminClient();

  const { data: before } = await adminClient
    .from("categories")
    .select("name, slug, parent_id, commission_rate_bps, sort_order, is_active")
    .eq("id", categoryId)
    .single();

  const updateData: {
    name?: string;
    slug?: string;
    parent_id?: string | null;
    commission_rate_bps?: number | null;
    sort_order?: number;
    is_active?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.parentId !== undefined) updateData.parent_id = input.parentId;
  if (input.commissionRateBps !== undefined) updateData.commission_rate_bps = input.commissionRateBps;
  if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;

  const { error } = await adminClient
    .from("categories")
    .update(updateData)
    .eq("id", categoryId);

  if (error) {
    console.error("Failed to update category:", error.message);
    throw new Error("Failed to update category");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "CATEGORY_UPDATED",
    entity: "categories",
    entity_id: categoryId,
    before: before || null,
    after: updateData,
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for category update:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

// -------------------------------------------------------------
// Brands Management
// -------------------------------------------------------------

export async function listAdminBrands(adminId: string, adminRole: string) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("brands")
    .select("id, name, slug, logo, created_at, updated_at")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to list brands:", error.message);
    throw new Error("Failed to list brands");
  }

  return data ?? [];
}

export async function createAdminBrand(
  input: { name: string; slug: string; logo?: string | null },
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true; brandId: string }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("brands")
    .insert({
      name: input.name,
      slug: input.slug,
      logo: input.logo ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create brand:", error?.message);
    throw new Error("Failed to create brand");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "BRAND_CREATED",
    entity: "brands",
    entity_id: data.id,
    before: null,
    after: { name: input.name, slug: input.slug },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for brand creation:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true, brandId: data.id };
}

export async function deleteAdminBrand(
  brandId: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("brands")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", brandId);

  if (error) {
    console.error("Failed to delete brand:", error.message);
    throw new Error("Failed to delete brand");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "BRAND_DELETED",
    entity: "brands",
    entity_id: brandId,
    before: null,
    after: { deleted: true },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for brand deletion:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}

// -------------------------------------------------------------
// Search Synonyms Management
// -------------------------------------------------------------

export async function listAdminSynonyms(adminId: string, adminRole: string) {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("search_synonyms")
    .select("id, term, maps_to, created_at, updated_at")
    .order("term", { ascending: true });

  if (error) {
    console.error("Failed to list synonyms:", error.message);
    throw new Error("Failed to list synonyms");
  }

  return data ?? [];
}

export async function createAdminSynonym(
  input: { term: string; mapsTo: string },
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true; synonymId: string }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("search_synonyms")
    .insert({
      term: input.term.trim().toLowerCase(),
      maps_to: input.mapsTo.trim().toLowerCase(),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create synonym:", error?.message);
    throw new Error("Failed to create synonym");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "SYNONYM_CREATED",
    entity: "search_synonyms",
    entity_id: data.id,
    before: null,
    after: { term: input.term, maps_to: input.mapsTo },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for synonym creation:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true, synonymId: data.id };
}

export async function deleteAdminSynonym(
  synonymId: string,
  adminId: string,
  adminRole: string,
  ipAddress: string
): Promise<{ success: true }> {
  const hasPerm = await checkAdminPermission(adminId, adminRole, "manage_catalog");
  if (!hasPerm) {
    throw new Error("Access denied: manage_catalog permission required");
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("search_synonyms")
    .delete()
    .eq("id", synonymId);

  if (error) {
    console.error("Failed to delete synonym:", error.message);
    throw new Error("Failed to delete synonym");
  }

  const { error: auditError } = await adminClient.from("audit_logs").insert({
    actor_id: adminId,
    action: "SYNONYM_DELETED",
    entity: "search_synonyms",
    entity_id: synonymId,
    before: null,
    after: { deleted: true },
    ip: ipAddress,
  });

  if (auditError) {
    console.error("Failed to record audit log for synonym deletion:", auditError.message);
    throw new Error("Failed to record mandatory audit log");
  }

  return { success: true };
}
