import { z } from "zod";

export const sellerOnboardingSchema = z.object({
  businessName: z.string().min(2, "Business name is too short").max(100, "Business name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  businessType: z.string().min(1, "Business type is required"),
  
  // KYC
  cnicNumber: z.string().regex(/^(\d{13}|\d{5}-\d{7}-\d{1})$/, "CNIC must be 13 digits or in format XXXXX-XXXXXXX-X"),
  ntn: z.string().optional(),
  
  // Bank Account
  bankName: z.string().min(2, "Bank name is required"),
  accountTitle: z.string().min(2, "Account title is required"),
  iban: z.string().regex(/^PK[a-zA-Z0-9]{22}$/i, "IBAN must be a valid Pakistani IBAN starting with PK followed by 22 characters"),
  
  // Pickup Address
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Phone number is required"),
  province: z.string().min(2, "Province is required"),
  city: z.string().min(2, "City is required"),
  area: z.string().min(2, "Area is required"),
  street: z.string().min(5, "Street address is required"),
  postalCode: z.string().optional(),
  
  agreementAccepted: z.literal(true, {
    message: "You must accept the Seller Agreement"
  }),
});

export type SellerOnboardingInput = z.infer<typeof sellerOnboardingSchema>;
