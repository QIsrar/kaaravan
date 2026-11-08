/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

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

export type PakistanProvince = (typeof PAKISTAN_PROVINCES)[number];

export const CITIES_BY_PROVINCE: Record<PakistanProvince, readonly string[]> = {
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

/**
 * Phone: Digits only, exactly 11 digits starting with 03 (e.g. 03001234567)
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^03\d{9}$/, "Phone must be exactly 11 digits starting with 03 (e.g. 03001234567)");

/**
 * CNIC: Digits only, 13 digits, formatted as 12345-1234567-1 or 13 digits unformatted
 */
export const cnicSchema = z
  .string()
  .trim()
  .regex(/^(\d{5}-\d{7}-\d{1}|\d{13})$/, "CNIC must be 13 digits (e.g. 12345-1234567-1)");

/**
 * IBAN: uppercase, spaces stripped, max 24 chars, PK + 2 digits + 4 letters + 16 digits
 */
export const ibanSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, "").toUpperCase())
  .pipe(
    z
      .string()
      .regex(
        /^PK\d{2}[A-Z]{4}\d{16}$/,
        "IBAN must be a valid 24-character Pakistani IBAN (e.g. PK36HABB0000001234567890)"
      )
  );

export const provinceSchema = z.enum(PAKISTAN_PROVINCES, {
  message: "Please select a valid province or territory",
});

export const citySchema = z.string().trim().min(2, "City is required");

export function isCityInProvince(province: string, city: string): boolean {
  const provinceCities = (CITIES_BY_PROVINCE as Record<string, readonly string[]>)[province];
  return !!provinceCities && provinceCities.includes(city);
}

export const pkPickupAddressSchema = z
  .object({
    full_name: z.string().trim().min(2, "Full name is required"),
    phone: phoneSchema,
    province: provinceSchema,
    city: citySchema,
    area: z.string().trim().min(2, "Area is required"),
    street: z.string().trim().min(5, "Street address is required"),
    postal_code: z.string().trim().optional(),
  })
  .refine((data) => isCityInProvince(data.province, data.city), {
    message: "Select a city that belongs to the chosen province/territory",
    path: ["city"],
  });

