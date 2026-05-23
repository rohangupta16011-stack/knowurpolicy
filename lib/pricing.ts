import { headers } from "next/headers";

// Region-aware pricing for per-document analysis.
//
// Tier 1 = developed markets, full USD price
// Tier 2 = India (Razorpay's primary market), INR-native pricing
// Tier 3 = emerging markets, USD discounted ~50%
//
// Country detection uses Vercel's `x-vercel-ip-country` header (free, set
// automatically on the edge). Falls back to Tier 1 (USD) when missing.

export type PricingTier = {
  tier: "tier1" | "tier2" | "tier3";
  currency: "USD" | "INR";
  symbol: "$" | "₹";
  /** numeric price per document, in the currency above */
  perDoc: number;
  /** formatted price for display, e.g. "$2.99" or "₹99" */
  perDocDisplay: string;
  /** equivalent in USD, for backend reconciliation */
  perDocUsdEquivalent: number;
};

const TIER1_USD: PricingTier = {
  tier: "tier1",
  currency: "USD",
  symbol: "$",
  perDoc: 2.99,
  perDocDisplay: "$2.99",
  perDocUsdEquivalent: 2.99,
};

const TIER2_INR: PricingTier = {
  tier: "tier2",
  currency: "INR",
  symbol: "₹",
  perDoc: 99,
  perDocDisplay: "₹99",
  perDocUsdEquivalent: 1.19, // ~₹83/USD as of 2026
};

const TIER3_USD: PricingTier = {
  tier: "tier3",
  currency: "USD",
  symbol: "$",
  perDoc: 1.49,
  perDocDisplay: "$1.49",
  perDocUsdEquivalent: 1.49,
};

// Tier 1: developed markets that bear full USD pricing.
const TIER1_COUNTRIES = new Set([
  // North America
  "US", "CA",
  // UK + Ireland
  "GB", "IE",
  // EU
  "DE", "FR", "IT", "ES", "NL", "BE", "SE", "NO", "DK", "FI", "CH", "AT",
  "LU", "IS", "PT", "GR", "CZ", "PL", "EE", "LV", "LT", "SK", "SI", "MT",
  "CY", "HU", "RO", "BG", "HR",
  // Asia-Pacific developed
  "AU", "NZ", "JP", "SG", "HK", "KR", "TW",
  // Gulf
  "AE", "QA", "KW", "SA", "BH", "OM", "IL",
]);

export function getPricingForCountry(country: string | null | undefined): PricingTier {
  if (!country) return TIER1_USD;
  if (country === "IN") return TIER2_INR;
  if (TIER1_COUNTRIES.has(country.toUpperCase())) return TIER1_USD;
  return TIER3_USD;
}

/**
 * Read the country from Vercel's edge headers. Server-component-only — this
 * imports next/headers which is server-only.
 */
export function getPricingFromRequest(): PricingTier {
  const country = headers().get("x-vercel-ip-country");
  return getPricingForCountry(country);
}
