/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

"use server";

import { revalidatePath } from "next/cache";
import { getClientIp } from "@/lib/utils";
import { headers } from "next/headers";
import { requireAuth } from "@/lib/auth/roles";
import {
  productUpsertSchema,
  stockUpdateSchema,
  reorderImagesSchema,
  ProductUpsertInput,
  uuidSchema,
} from "@/lib/validators/seller-catalog";
import {
  upsertSellerProduct,
  updateVariantStock,
  uploadProductImage,
  deleteProductImage,
  updateProductImageOrder,
} from "@/lib/services/seller-products";
import { ZodError } from "zod";


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

    const ip = getClientIp(await headers());

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

    let parsedId: string | undefined;
    if (productId) {
      parsedId = uuidSchema.parse(productId);
    }

    const result = await upsertSellerProduct(
      sellerId,
      profile.id,
      ip,
      input,
      parsedId
    );

    revalidatePath("/seller/products");
    if (result.productId) {
      revalidatePath(`/seller/products/${result.productId}`);
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("upsertProductAction error:", error);
    const err = error as Error;
    let msg = "Failed to save product";
    if (err.message.includes("SKU") || err.message.includes("Stock") || err.message.includes("Original price") || err.message.includes("active variant")) {
      msg = err.message;
    }

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
    } else if (msg.includes("uploaded image")) {
      fieldErrors["images"] = msg;
    } else if (msg.includes("active variant")) {
      fieldErrors["variants"] = msg;
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

    const parsedVariantId = uuidSchema.parse(variantId);
    const parsed = stockUpdateSchema.parse({ stock_quantity: newStock });
    const ip = getClientIp(await headers());

    await updateVariantStock(sellerId, profile.id, parsedVariantId, parsed.stock_quantity, ip);

    revalidatePath("/seller/products");
    if (productId) {
      revalidatePath(`/seller/products/${productId}`);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("updateVariantStockAction error:", error);
    let msg = "Failed to update stock";
    if (error instanceof Error && error.message.includes("cannot be lower than reserved")) {
      msg = error.message;
    }
    return { success: false, error: msg };
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

    const parsedProductId = uuidSchema.parse(productId);
    const ip = getClientIp(await headers());
    const result = await uploadProductImage(sellerId, parsedProductId, file, profile.id, ip);

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
    console.error("uploadProductImageAction error:", error);
    let msg = "Failed to upload image";
    if (error instanceof Error && (error.message.includes("Maximum of 8 images") || error.message.includes("smaller than 5MB") || error.message.includes("converted to WebP"))) {
      msg = error.message;
    }
    return { success: false, error: msg };
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

    const parsedImageId = uuidSchema.parse(imageId);
    const ip = getClientIp(await headers());
    await deleteProductImage(sellerId, parsedImageId, profile.id, ip);

    revalidatePath(`/seller/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("deleteProductImageAction error:", error);
    return { success: false, error: "Failed to delete image" };
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

    const parsedProductId = uuidSchema.parse(productId);
    const parsed = reorderImagesSchema.parse({ orderedImageIds });
    const ip = getClientIp(await headers());

    await updateProductImageOrder(
      sellerId,
      parsedProductId,
      parsed.orderedImageIds,
      profile.id,
      ip
    );

    revalidatePath(`/seller/products/${productId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("reorderProductImagesAction error:", error);
    return { success: false, error: "Failed to reorder images" };
  }
}
