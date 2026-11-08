/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { z } from "zod";
import {
  phoneSchema,
  provinceSchema,
  citySchema,
  isCityInProvince,
} from "@/lib/validators/pk";

export const pakistaniPhoneRegex = /^03\d{9}$/;

export const updateProfileSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters")
      .optional(),
    phone: phoneSchema
      .or(z.literal(""))
      .nullable()
      .optional()
      .transform((val) => (val === "" ? null : val)),
  })
  .strip();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const createAddressSchema = z
  .object({
    label: z.string().trim().max(50).nullable().optional(),
    full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
    phone: phoneSchema,
    province: provinceSchema,
    city: citySchema,
    area: z.string().trim().min(2, "Area is required"),
    street: z.string().trim().min(5, "Street address must be at least 5 characters"),
    postal_code: z.string().trim().max(20).nullable().optional(),
    is_default: z.boolean().optional().default(false),
  })
  .refine((data) => isCityInProvince(data.province, data.city), {
    message: "Select a city that belongs to the chosen province/territory",
    path: ["city"],
  })
  .strip();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

export const updateAddressSchema = z
  .object({
    label: z.string().trim().max(50).nullable().optional(),
    full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(100).optional(),
    phone: phoneSchema.optional(),
    province: provinceSchema.optional(),
    city: citySchema.optional(),
    area: z.string().trim().min(2, "Area is required").optional(),
    street: z.string().trim().min(5, "Street address must be at least 5 characters").optional(),
    postal_code: z.string().trim().max(20).nullable().optional(),
    is_default: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.province && data.city) {
        return isCityInProvince(data.province, data.city);
      }
      return true;
    },
    {
      message: "Select a city that belongs to the chosen province/territory",
      path: ["city"],
    }
  )
  .strip();

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

export const createReviewSchema = z
  .object({
    product_id: z.string().uuid("Invalid product ID"),
    order_item_id: z.string().uuid("Invalid order item ID"),
    rating: z
      .number()
      .int()
      .min(1, "Rating must be at least 1 star")
      .max(5, "Rating cannot exceed 5 stars"),
    title: z.string().trim().max(200).nullable().optional(),
    body: z
      .string()
      .trim()
      .min(10, "Review body must be at least 10 characters")
      .max(2000)
      .nullable()
      .optional(),
  })
  .strip();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
