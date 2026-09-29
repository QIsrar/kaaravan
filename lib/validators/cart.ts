import { z } from "zod";

export const postgresUuidSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "Invalid variant ID"
  );

export const addToCartSchema = z.object({
  variantId: postgresUuidSchema,
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Maximum quantity per item is 50"),
});

export const updateCartItemSchema = z.object({
  variantId: postgresUuidSchema,
  quantity: z.number().int().min(0, "Quantity must be non-negative").max(50, "Maximum quantity per item is 50"),
});

export const removeCartItemSchema = z.object({
  variantId: postgresUuidSchema,
});

export const mergeCartSchema = z.object({
  guestToken: z.string().min(10, "Invalid guest token"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
export type MergeCartInput = z.infer<typeof mergeCartSchema>;
