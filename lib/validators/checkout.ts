import { z } from "zod";
import {
  PAKISTAN_PROVINCES,
  CITIES_BY_PROVINCE,
  PAKISTAN_CITIES,
  type PakistanProvince,
  phoneSchema,
  provinceSchema,
  citySchema,
  isCityInProvince,
} from "@/lib/validators/pk";

export { PAKISTAN_PROVINCES, CITIES_BY_PROVINCE, PAKISTAN_CITIES, type PakistanProvince };

export const addressSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
    phone: phoneSchema,
    province: provinceSchema,
    city: citySchema,
    area: z.string().trim().min(2, "Town / Area / Sector is required"),
    street: z.string().trim().min(5, "Complete street address is required"),
    postalCode: z.string().trim().optional(),
  })
  .refine((data) => isCityInProvince(data.province, data.city), {
    message: "Select a city that belongs to the chosen province/territory",
    path: ["city"],
  });

export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddressSameAsShipping: z.boolean(),
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(["cod", "jazzcash", "easypaisa", "card", "bank_transfer"], {
    message: "Select a valid payment method",
  }),
  orderNotes: z.string().max(300).optional(),
  guestEmail: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  idempotencyKey: z.string().trim().max(100).optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
