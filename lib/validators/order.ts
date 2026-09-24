import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+92|0)?3[0-9]{9}$/, "Please enter a valid Pakistani mobile number"),
  streetAddress: z.string().trim().min(5, "Street address must be at least 5 characters"),
  city: z.string().trim().min(2, "City is required"),
  provinceState: z.string().trim().min(2, "Province/State is required"),
  postalCode: z.string().trim().optional(),
  country: z.string().default("Pakistan"),
});

export type AddressInput = z.infer<typeof addressSchema>;

/**
 * Client checkout submission schema.
 * Note: prices and totals are NOT accepted from client.
 * Server recalculates everything from database products, variants, and active promotions.
 */
export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddressSameAsShipping: z.boolean().default(true),
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(["cash_on_delivery", "card", "wallet"]),
  notes: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
