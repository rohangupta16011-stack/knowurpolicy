/**
 * Canonical site URL. Resolution order:
 *   1. NEXT_PUBLIC_APP_URL          — explicit override (set this when .com migrates to Vercel)
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel-set production alias (knowurpolicy.vercel.app today)
 *   3. http://localhost:3000         — dev fallback
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NAME = "KnowUrPolicy";
export const SITE_TAGLINE = "Understand before you sign.";
