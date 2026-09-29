import { z } from "zod";

export const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;

export const CITIES_BY_PROVINCE: Record<(typeof PAKISTAN_PROVINCES)[number], readonly string[]> = {
  Punjab: [
    "Lahore",
    "Faisalabad",
    "Rawalpindi",
    "Gujranwala",
    "Multan",
    "Bahawalpur",
    "Sargodha",
    "Sialkot",
    "Sheikhupura",
    "Jhang",
    "Rahim Yar Khan",
    "Gujrat",
    "Kasur",
    "Dera Ghazi Khan",
    "Sahiwal",
    "Okara",
    "Chiniot",
  ],
  Sindh: ["Karachi", "Sukkur", "Larkana", "Nawabshah"],
  "Khyber Pakhtunkhwa": ["Peshawar", "Mardan", "Abbottabad"],
  Balochistan: ["Quetta"],
  "Islamabad Capital Territory": ["Islamabad"],
  "Gilgit-Baltistan": ["Gilgit", "Skardu"],
  "Azad Jammu & Kashmir": ["Mirpur", "Muzaffarabad"],
} as const;

export const PAKISTAN_CITIES = Object.values(CITIES_BY_PROVINCE).flat();

export const addressSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
    phone: z
      .string()
      .trim()
      .regex(/^(03\d{9}|\+923\d{9})$/, "Enter a valid Pakistani mobile number (e.g. 03001234567)"),
    province: z.enum(PAKISTAN_PROVINCES, {
      message: "Please select a valid province/territory",
    }),
    city: z.string().trim().min(2, "City is required"),
    area: z.string().trim().min(2, "Town / Area / Sector is required"),
    street: z.string().trim().min(5, "Complete street address is required"),
    postalCode: z.string().trim().optional(),
  })
  .refine((data) => (CITIES_BY_PROVINCE[data.province] as readonly string[]).includes(data.city), {
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
});

export type PakistanProvince = (typeof PAKISTAN_PROVINCES)[number];
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
