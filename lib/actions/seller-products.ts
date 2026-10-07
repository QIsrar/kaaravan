/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth/roles";
import {
  productUpsertSchema,
  stockUpdateSchema,
  reorderImagesSchema,
  ProductUpsertInput,
} from "@/lib/validators/seller-catalog";
import {
  upsertSellerProduct,
  updateVariantStock,
  uploadProductImage,
  deleteProductImage,
  updateProductImageOrder,
} from "@/lib/services/seller-products";
import { ZodError } from "zod";

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function upsertProductAction(
  rawInput: unknown,
  productId?: string
): Promise<ActionResult<{ productId: string }>> {
  try {
    const profile = await requireAuth(["seller"]);
    const sellerId = profile.seller_id;
    if (!sellerId) {
      return { success: false, error: "Seller account not found or not approved" };
    }

    const ip = await getClientIp();

    let input: ProductUpsertInput;
    try {
      input = productUpsertSchema.parse(rawInput);
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          const path = issue.path.join(".");
          fieldErrors[path] = issue.message;
        }
        return {
          success: false,
          error: "Validation failed. Please check the highlighted fields.",
          fieldErrors,
        };
      }
      throw err;
    }

    const result = await upsertSellerProduct(
      sellerId,
      profile.id,
      ip,
      input,
      productId
    );

    revalidatePath("/seller/products");
    if (result.productId) {
      revalidatePath(`/seller/products/${result.productId}`);
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || "Failed to save product";

    const fieldErrors: Record<string, string> = {};
    const rawVariants = (rawInput as { variants?: { sku?: string }[] })?.variants;

    if (msg.includes("SKU") && msg.includes("already in use")) {
      const match = msg.match(/SKU\s+([^\s]+)/);
      const sku = match ? match[1] : null;
      const idx = sku && rawVariants ? rawVariants.findIndex((v) => v.sku === sku) : -1;
      if (idx >= 0) {
        fieldErrors[`variants.${idx}.sku`] = msg;
      } else {
        fieldErrors["sku"] = msg;
      }
    } else if (msg.includes("Stock cannot be less than reserved")) {
      const match = msg.match(/for SKU\s+([^\s]+)/);
      const sku = match ? match[1] : null;
      const idx = sku && rawVariants ? rawVariants.findIndex((v) => v.sku === sku) : -1;
      if (idx >= 0) {
        fieldErrors[`variants.${idx}.stock_quantity`] = msg;
      } else {
        fieldErrors["stock"] = msg;
      }
    } else if (msg.includes("Original price") || msg.includes("Compare at price")) {
      fieldErrors["compare_at"] = msg;
    }

    return {
      success: false,
      error: msg,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    };
  }
}

export async function updateVariantStockAction(
  variantId: string,
  newStock: number,
  productId?: string
): Promise<ActionResult> {
  try {
    const profile = await requireAuth(["seller"]);
    const sellerId = profile.seller_id;
    if (!sellerId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = stockUpdateSchema.parse({ stock_quantity: newStock });
    const ip = await getClientIp();

    await updateVariantStock(sellerId, profile.id, variantId, parsed.stock_quantity, ip);

    revalidatePath("/seller/products");
    if (productId) {
      revalidatePath(`/seller/products/${productId}`);
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to update stock" };
  }
}

export async function uploadProductImageAction(
  productId: string,
  formData: FormData
): Promise<ActionResult<{ id: string; path: string; sort_order: number }>> {
  try {
    const profile = await requireAuth(["seller"]);
    const sellerId = profile.seller_id;
    if (!sellerId) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "Missing image file" };
    }

    const ip = await getClientIp();
    const result = await uploadProductImage(sellerId, productId, file, profile.id, ip);

    revalidatePath(`/seller/products/${productId}`);
    return {
      success: true,
      data: {
        id: result.image.id,
        path: result.image.path,
        sort_order: result.image.sort_order,
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to upload image" };
  }
}

export async function deleteProductImageAction(
  imageId: string,
  productId: string
): Promise<ActionResult> {
  try {
    const profile = await requireAuth(["seller"]);
    const sellerId = profile.seller_id;
    if (!sellerId) {
      return { success: false, error: "Unauthorized" };
    }

    const ip = await getClientIp();
    await deleteProductImage(sellerId, imageId, profile.id, ip);

    revalidatePath(`/seller/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to delete image" };
  }
}

export async function reorderProductImagesAction(
  productId: string,
  orderedImageIds: string[]
): Promise<ActionResult> {
  try {
    const profile = await requireAuth(["seller"]);
    const sellerId = profile.seller_id;
    if (!sellerId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = reorderImagesSchema.parse({ orderedImageIds });
    const ip = await getClientIp();

    await updateProductImageOrder(
      sellerId,
      productId,
      parsed.orderedImageIds,
      profile.id,
      ip
    );

    revalidatePath(`/seller/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to reorder images" };
  }
}
