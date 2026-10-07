/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";
import { ProductUpsertInput } from "@/lib/validators/seller-catalog";

function generateSlug(title: string): string {
  const generated = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
    
  if (!generated) return "product-" + Math.random().toString(36).substring(2, 8);
  return generated;
}

export async function upsertSellerProduct(
  sellerId: string,
  profileId: string,
  ipAddress: string,
  input: ProductUpsertInput,
  productId?: string
) {
  const supabase = createAdminClient();

  // 1. Verify seller exists, is approved, and matches profileId
  const { data: seller, error: sellerErr } = await supabase
    .from("sellers")
    .select("id, status")
    .eq("id", sellerId)
    .eq("owner_profile_id", profileId)
    .single();

  if (sellerErr || !seller) {
    throw new Error("Unauthorized");
  }

  if (seller.status !== "approved") {
    throw new Error("Only approved sellers can manage products");
  }

  // 2. Validate category: must be active AND a leaf (no children with this parent_id)
  const { data: category, error: catErr } = await supabase
    .from("categories")
    .select("id, is_active")
    .eq("id", input.category_id)
    .single();

  if (catErr || !category || !category.is_active) {
    throw new Error("Category must be an active leaf category");
  }

  // Check no children reference this category as their parent_id
  const { count: childCount, error: childErr } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", input.category_id);

  if (childErr) throw new Error("Failed to validate category");
  if (childCount !== null && childCount > 0) {
    throw new Error("Category must be an active leaf category (no sub-categories allowed)");
  }

  let dbProductId = productId;

  if (dbProductId) {
    // Updating existing product — verify ownership
    const { data: existing, error: extErr } = await supabase
      .from("products")
      .select("status")
      .eq("id", dbProductId)
      .eq("seller_id", sellerId)
      .single();
      
    if (extErr || !existing) throw new Error("Product not found");
    
    // If already active, keep active unless seller explicitly archives
    const finalStatus = existing.status === "active" && input.status !== "archived" 
      ? "active" 
      : input.status;

    if (finalStatus === "pending_review") {
      const { count: imageCount, error: imgCountErr } = await supabase
        .from("product_images")
        .select("id", { count: "exact", head: true })
        .eq("product_id", dbProductId);

      if (imgCountErr) throw new Error("Failed to verify product images");
      if (!imageCount || imageCount < 1) {
        throw new Error("Product must have at least one uploaded image before submitting for review");
      }

      const hasActiveVariantWithPrice = input.variants.some(
        (v) => v.is_active && v.price_minor > 0
      );
      if (!hasActiveVariantWithPrice) {
        throw new Error("Product must have at least one active variant with a valid price before submitting for review");
      }
    }

    const { error: updErr } = await supabase
      .from("products")
      .update({
        title: input.title,
        description: input.description,
        category_id: input.category_id,
        brand_id: input.brand_id,
        status: finalStatus
      })
      .eq("id", dbProductId);
      
    if (updErr) throw updErr;

    // Audit log
    const { error: auditErr1 } = await supabase.from("audit_logs").insert({
      actor_id: profileId,
      action: 'SELLER_UPDATED_PRODUCT',
      entity: 'products',
      entity_id: dbProductId,
      before: existing,
      after: JSON.parse(JSON.stringify({ ...input, status: finalStatus })),
      ip: ipAddress
    });
    if (auditErr1) throw new Error("Failed to write audit log");
  } else {
    if (input.status === "pending_review") {
      throw new Error("Product must have at least one uploaded image before submitting for review");
    }

    // Generate unique slug
    let slug = generateSlug(input.title);
    let counter = 1;
    while (true) {
      const { count, error: slugErr } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("slug", slug);
      if (slugErr) throw new Error("Failed to check slug uniqueness");
      if (count === 0) break;
      slug = `${generateSlug(input.title)}-${counter++}`;
    }

    const { data: newProd, error: insErr } = await supabase
      .from("products")
      .insert({
        seller_id: sellerId,
        title: input.title,
        slug,
        description: input.description,
        category_id: input.category_id,
        brand_id: input.brand_id,
        status: input.status
      })
      .select("id")
      .single();

    if (insErr || !newProd) throw insErr ?? new Error("Failed to create product");
    dbProductId = newProd.id;

    const { error: auditErr2 } = await supabase.from("audit_logs").insert({
      actor_id: profileId,
      action: 'SELLER_CREATED_PRODUCT',
      entity: 'products',
      entity_id: dbProductId,
      after: JSON.parse(JSON.stringify({ ...input, slug })),
      ip: ipAddress
    });
    if (auditErr2) throw new Error("Failed to write audit log");
  }

  // Handle variants
  for (const variant of input.variants) {
    if (variant.id) {
      // Verify ownership and reserved stock constraint
      const { data: existingVar, error: varErr } = await supabase
        .from("product_variants")
        .select("reserved_quantity")
        .eq("id", variant.id)
        .eq("product_id", dbProductId)
        .single();
        
      if (varErr || !existingVar) throw new Error(`Variant ${variant.id} not found`);
      if (variant.stock_quantity < existingVar.reserved_quantity) {
        throw new Error(`Stock cannot be less than reserved quantity (${existingVar.reserved_quantity}) for SKU ${variant.sku}`);
      }

      const { error: updErr2 } = await supabase
        .from("product_variants")
        .update({
          sku: variant.sku,
          price_minor: variant.price_minor,
          compare_at_minor: variant.compare_at_minor,
          stock_quantity: variant.stock_quantity,
          low_stock_threshold: variant.low_stock_threshold,
          attributes: variant.attributes,
          is_active: variant.is_active
        })
        .eq("id", variant.id);

      if (updErr2) {
        if (updErr2.code === "23505" && updErr2.message.includes("sku")) {
          throw new Error(`SKU ${variant.sku} is already in use by another variant.`);
        }
        throw updErr2;
      }
    } else {
      const { error: insErr2 } = await supabase
        .from("product_variants")
        .insert({
          product_id: dbProductId,
          sku: variant.sku,
          price_minor: variant.price_minor,
          compare_at_minor: variant.compare_at_minor,
          stock_quantity: variant.stock_quantity,
          low_stock_threshold: variant.low_stock_threshold,
          attributes: variant.attributes,
          is_active: variant.is_active
        });

      if (insErr2) {
        if (insErr2.code === "23505" && insErr2.message.includes("sku")) {
          throw new Error(`SKU ${variant.sku} is already in use by another variant.`);
        }
        throw insErr2;
      }
    }
  }

  return { productId: dbProductId };
}

export async function updateVariantStock(
  sellerId: string,
  profileId: string,
  variantId: string,
  newStock: number,
  ipAddress: string
) {
  const supabase = createAdminClient();

  // Verify seller is approved
  const { data: seller, error: sellerErr } = await supabase
    .from("sellers")
    .select("status")
    .eq("id", sellerId)
    .single();

  if (sellerErr || !seller) throw new Error("Unauthorized");
  if (seller.status !== "approved") {
    throw new Error("Only approved sellers can update stock");
  }

  const { data: variant, error: varErr } = await supabase
    .from("product_variants")
    .select("product_id, stock_quantity, reserved_quantity, products!inner(seller_id)")
    .eq("id", variantId)
    .single();

  if (varErr || !variant || (variant.products as { seller_id: string }).seller_id !== sellerId) {
    throw new Error("Unauthorized or variant not found");
  }

  if (newStock < variant.reserved_quantity) {
    throw new Error(`Stock cannot be lower than reserved quantity (${variant.reserved_quantity})`);
  }

  const { error: updErr } = await supabase
    .from("product_variants")
    .update({ stock_quantity: newStock })
    .eq("id", variantId);

  if (updErr) throw updErr;

  const { error: auditErr3 } = await supabase.from("audit_logs").insert({
    actor_id: profileId,
    action: 'SELLER_UPDATED_STOCK',
    entity: 'product_variants',
    entity_id: variantId,
    before: { stock_quantity: variant.stock_quantity },
    after: { stock_quantity: newStock },
    ip: ipAddress
  });
  if (auditErr3) throw new Error("Failed to write audit log");

  return { success: true };
}

export async function uploadProductImage(
  sellerId: string,
  productId: string,
  file: File,
  profileId: string,
  ipAddress: string
) {
  const supabase = createAdminClient();

  // Validate owner
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("seller_id")
    .eq("id", productId)
    .single();

  if (prodErr || !product || product.seller_id !== sellerId) {
    throw new Error("Unauthorized to upload images for this product");
  }

  // Validate approved seller
  const { data: seller, error: sellerErr } = await supabase
    .from("sellers")
    .select("status")
    .eq("id", sellerId)
    .single();

  if (sellerErr || !seller || seller.status !== "approved") {
    throw new Error("Only approved sellers can upload images");
  }

  // Max 8 images
  const { count, error: countErr } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (countErr) throw new Error("Failed to check image count");
  if (count !== null && count >= 8) {
    throw new Error("Maximum of 8 images allowed per product");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be smaller than 5MB");
  }

  if (file.type !== "image/webp") {
    // Client must compress to WebP before upload
    throw new Error("Image must be converted to WebP");
  }

  const randomUuid = crypto.randomUUID();
  const bucket = "product-images";
  const objectPath = `${sellerId}/${productId}/${randomUuid}.webp`;
  const fullPath = `${bucket}/${objectPath}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file, { contentType: "image/webp" });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  // Get current max sort_order
  const { data: existingImages, error: sortErr } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (sortErr) {
    await supabase.storage.from(bucket).remove([objectPath]);
    throw new Error("Failed to determine image sort order");
  }

  const nextSortOrder = (existingImages?.[0]?.sort_order ?? 0) + 1;

  const { data: newImage, error: dbError } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      path: fullPath,
      sort_order: nextSortOrder
    })
    .select()
    .single();

  if (dbError || !newImage) {
    await supabase.storage.from(bucket).remove([objectPath]);
    throw new Error(`DB record failed: ${dbError?.message ?? "unknown"}`);
  }

  const { error: auditErr } = await supabase.from("audit_logs").insert({
    actor_id: profileId,
    action: "SELLER_UPLOADED_IMAGE",
    entity: "product_images",
    entity_id: newImage.id,
    after: { product_id: productId, path: fullPath },
    ip: ipAddress
  });
  if (auditErr) throw new Error("Failed to write audit log");

  return { success: true, image: newImage };
}

export async function deleteProductImage(
  sellerId: string,
  imageId: string,
  profileId: string,
  ipAddress: string
) {
  const supabase = createAdminClient();

  const { data: image, error: imgErr } = await supabase
    .from("product_images")
    .select("path, product_id, products!inner(seller_id)")
    .eq("id", imageId)
    .single();

  if (imgErr || !image || (image.products as { seller_id: string }).seller_id !== sellerId) {
    throw new Error("Unauthorized or image not found");
  }

  // Validate approved seller
  const { data: seller, error: sellerErr } = await supabase
    .from("sellers")
    .select("status")
    .eq("id", sellerId)
    .single();

  if (sellerErr || !seller || seller.status !== "approved") {
    throw new Error("Only approved sellers can delete images");
  }

  // Delete from DB
  const { error: delErr } = await supabase.from("product_images").delete().eq("id", imageId);
  if (delErr) throw new Error("Failed to delete image record");

  // Delete from storage (server-built path, not client-supplied)
  const pathParts = image.path.split("/");
  const storageBucket = pathParts.shift()!;
  const objectPath = pathParts.join("/");
  const { error: rmErr } = await supabase.storage.from(storageBucket).remove([objectPath]);
  if (rmErr) throw new Error("Failed to remove image from storage");

  const { error: auditErr } = await supabase.from("audit_logs").insert({
    actor_id: profileId,
    action: "SELLER_DELETED_IMAGE",
    entity: "product_images",
    entity_id: imageId,
    before: { product_id: image.product_id, path: image.path },
    ip: ipAddress
  });
  if (auditErr) throw new Error("Failed to write audit log");

  return { success: true };
}

export async function updateProductImageOrder(
  sellerId: string,
  productId: string,
  orderedImageIds: string[],
  profileId: string,
  ipAddress: string
) {
  const supabase = createAdminClient();

  // Validate approved seller and profile ownership
  const { data: seller, error: sellerErr } = await supabase
    .from("sellers")
    .select("status")
    .eq("id", sellerId)
    .eq("owner_profile_id", profileId)
    .single();

  if (sellerErr || !seller) throw new Error("Unauthorized");
  if (seller.status !== "approved") {
    throw new Error("Only approved sellers can manage products");
  }

  // Validate product ownership
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id, seller_id")
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .single();

  if (prodErr || !product) {
    throw new Error("Product not found or unauthorized");
  }

  // Get current images
  const { data: existingImages, error: imgErr } = await supabase
    .from("product_images")
    .select("id, sort_order")
    .eq("product_id", productId);

  if (imgErr || !existingImages) {
    throw new Error("Failed to fetch product images");
  }

  const existingMap = new Set(existingImages.map((img) => img.id));
  for (const imgId of orderedImageIds) {
    if (!existingMap.has(imgId)) {
      throw new Error(`Image ${imgId} does not belong to product ${productId}`);
    }
  }

  for (let i = 0; i < orderedImageIds.length; i++) {
    const imgId = orderedImageIds[i];
    const { error: updErr } = await supabase
      .from("product_images")
      .update({ sort_order: i + 1 })
      .eq("id", imgId)
      .eq("product_id", productId);

    if (updErr) throw updErr;
  }

  const { error: auditErr } = await supabase.from("audit_logs").insert({
    actor_id: profileId,
    action: "SELLER_REORDERED_IMAGES",
    entity: "product_images",
    entity_id: productId,
    before: existingImages,
    after: { ordered_image_ids: orderedImageIds },
    ip: ipAddress,
  });
  if (auditErr) throw new Error("Failed to write audit log");

  return { success: true };
}

