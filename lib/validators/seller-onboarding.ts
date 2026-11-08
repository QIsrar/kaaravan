import { z } from "zod";
import {
  phoneSchema,
  cnicSchema,
  ibanSchema,
  provinceSchema,
  citySchema,
  isCityInProvince,
} from "@/lib/validators/pk";

export const sellerOnboardingSchema = z
  .object({
    businessName: z.string().trim().min(2, "Business name is too short").max(100, "Business name is too long"),
    description: z.string().trim().max(500, "Description is too long").optional(),
    businessType: z.string().min(1, "Business type is required"),

    // KYC
    cnicNumber: cnicSchema,
    ntn: z.string().trim().optional(),

    // Bank Account
    bankName: z.string().trim().min(2, "Bank name is required"),
    accountTitle: z.string().trim().min(2, "Account title is required"),
    iban: ibanSchema,

    // Pickup Address
    fullName: z.string().trim().min(2, "Full name is required"),
    phone: phoneSchema,
    province: provinceSchema,
    city: citySchema,
    area: z.string().trim().min(2, "Area is required"),
    street: z.string().trim().min(5, "Street address is required"),
    postalCode: z.string().trim().optional(),

    agreementAccepted: z.boolean().refine((val) => val === true, {
      message: "agreementError",
    }),
  })
  .refine((data) => isCityInProvince(data.province, data.city), {
    message: "Select a city that belongs to the chosen province/territory",
    path: ["city"],
  });

export type SellerOnboardingInput = z.infer<typeof sellerOnboardingSchema>;
