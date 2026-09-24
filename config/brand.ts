/**
 * Kaaravan Brand Configuration
 *
 * KAARAVAN IDENTITY:
 * - Brand idea: A caravan — a trusted group of traders travelling together.
 *   Themes: journey, trust, community, fair deals.
 * - Palette tokens: deep teal (primary), desert sand & warm gold (surfaces and accents),
 *   terracotta (calls to action & sale badges), ink-charcoal text.
 */

export const BRAND_CONFIG = {
  name: "Kaaravan",
  nameUrdu: "کارواں",
  tagline: "A trusted marketplace journey across Pakistan",
  taglineUrdu: "پاکستان بھر میں قابل اعتماد تجارتی سفر",
  logoPath: "/brand/logo.svg",
  symbolPath: "/brand/symbol.svg",
  socials: {
    twitter: "https://twitter.com/kaaravanpk",
    instagram: "https://instagram.com/kaaravanpk",
    facebook: "https://facebook.com/kaaravanpk",
  },
  contact: {
    supportEmail: "salam@kaaravan.pk",
    phone: "+92 51 111-KAARAVAN",
  },
} as const;

export type BrandConfig = typeof BRAND_CONFIG;
