import { z } from "zod";
import { parseRupeesToPaisa } from "@/lib/format/currency";

export const productStatusSchema = z.enum(["draft", "pending_review", "archived"]);

export const productSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(2000).optional(),
  category_id: z.string().uuid(),
  brand_id: z.string().uuid().optional().nullable(),
  status: productStatusSchema
});

export const productVariantSchema = z.object({
  id: z.string().uuid().optional(), // For updates
  sku: z.string().min(2).max(50),
  price_rupees: z.string().refine(val => {
    try { parseRupeesToPaisa(val); return true; } catch { return false; }
  }, "Invalid price format"),
  compare_at_rupees: z.string().optional().nullable().refine(val => {
    if (!val) return true;
    try { parseRupeesToPaisa(val); return true; } catch { return false; }
  }, "Invalid price format"),
  stock_quantity: z.number().int().min(0),
  low_stock_threshold: z.number().int().min(0).default(5),
  attributes: z.record(z.string(), z.string()).default({}),
  is_active: z.boolean().default(true)
}).transform(data => {
  const price_minor = parseRupeesToPaisa(data.price_rupees);
  const compare_at_minor = data.compare_at_rupees ? parseRupeesToPaisa(data.compare_at_rupees) : null;
  return { ...data, price_minor, compare_at_minor };
}).refine(data => !data.compare_at_minor || data.compare_at_minor > data.price_minor, {
  message: "Compare at price must be greater than price",
  path: ["compare_at_rupees"]
});

export const productUpsertSchema = productSchema.extend({
  variants: z.array(productVariantSchema).min(1, "At least one variant is required")
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof productVariantSchema>;
export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;

export const stockUpdateSchema = z.object({
  stock_quantity: z.number().int().min(0)
});
