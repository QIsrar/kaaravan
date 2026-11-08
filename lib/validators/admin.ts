/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { z } from "zod";
import { ibanSchema } from "./pk";

export const ADMIN_PERMISSIONS = [
  "manage_sellers",
  "manage_catalog",
  "manage_orders",
  "manage_finance",
  "manage_logistics",
  "manage_disputes",
  "manage_promotions",
  "manage_content",
  "manage_settings",
  "manage_users",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const adminPermissionSchema = z.enum(ADMIN_PERMISSIONS);

export const rejectSellerSchema = z.object({
  reason: z.string().trim().min(5, "Rejection reason must be at least 5 characters").max(500),
});

export const suspendSellerSchema = z.object({
  reason: z.string().trim().min(5, "Suspension reason must be at least 5 characters").max(500),
});

export const unsuspendSellerSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const setSellerCommissionSchema = z.object({
  commissionRateBps: z
    .number()
    .int("Commission rate must be an integer in basis points (1% = 100 bps)")
    .min(0, "Commission cannot be negative")
    .max(10000, "Commission cannot exceed 100% (10000 bps)")
    .nullable(),
});

export const bankChangeRequestSchema = z.object({
  bankName: z.string().trim().min(2, "Bank name must be at least 2 characters").max(100),
  accountTitle: z.string().trim().min(2, "Account title must be at least 2 characters").max(100),
  iban: ibanSchema,
  reason: z.string().trim().max(500).optional(),
});

export const reviewBankChangeSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(500).optional(),
});

export const rejectProductSchema = z.object({
  reason: z.string().trim().min(5, "Rejection reason must be at least 5 characters").max(500),
});

export const takeDownProductSchema = z.object({
  reason: z.string().trim().min(5, "Take down reason must be at least 5 characters").max(500),
});

export const adminOrderStatusChangeSchema = z.object({
  newStatus: z.enum([
    "awaiting_confirmation",
    "pending",
    "confirmed",
    "packed",
    "ready_to_ship",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ]),
  note: z.string().trim().min(5, "A mandatory note explaining this admin status override is required").max(500),
});

export const bannerSchema = z.object({
  titleEn: z.string().trim().max(200).optional().nullable(),
  titleUr: z.string().trim().max(200).optional().nullable(),
  subtitleEn: z.string().trim().max(300).optional().nullable(),
  subtitleUr: z.string().trim().max(300).optional().nullable(),
  tagEn: z.string().trim().max(50).optional().nullable(),
  tagUr: z.string().trim().max(50).optional().nullable(),
  imageUrl: z.string().trim().min(1, "Image URL is required"),
  linkUrl: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type RejectSellerInput = z.infer<typeof rejectSellerSchema>;
export type SuspendSellerInput = z.infer<typeof suspendSellerSchema>;
export type SetSellerCommissionInput = z.infer<typeof setSellerCommissionSchema>;
export type BankChangeRequestInput = z.infer<typeof bankChangeRequestSchema>;
export type ReviewBankChangeInput = z.infer<typeof reviewBankChangeSchema>;
export type RejectProductInput = z.infer<typeof rejectProductSchema>;
export type TakeDownProductInput = z.infer<typeof takeDownProductSchema>;
export type AdminOrderStatusChangeInput = z.infer<typeof adminOrderStatusChangeSchema>;
export type BannerInput = z.infer<typeof bannerSchema>;

