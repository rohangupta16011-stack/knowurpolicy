import Razorpay from "razorpay";
import crypto from "node:crypto";
import type { PricingTier } from "@/lib/pricing";

// Lazy SDK init — throws clearly when env vars are missing so the calling
// route can surface a 500 with a useful message instead of crashing at import.
let _client: Razorpay | null = null;

export function razorpayClient(): Razorpay {
  if (_client) return _client;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay env vars missing — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
    );
  }
  _client = new Razorpay({ key_id, key_secret });
  return _client;
}

export function razorpayPublicKey(): string {
  const key_id = process.env.RAZORPAY_KEY_ID;
  if (!key_id) throw new Error("RAZORPAY_KEY_ID not set");
  return key_id;
}

/**
 * Convert a PricingTier's display price into the smallest currency unit
 * Razorpay expects (paise for INR, cents for USD).
 */
export function pricingToSmallestUnit(pricing: PricingTier): number {
  return Math.round(pricing.perDoc * 100);
}

/**
 * Verify the Razorpay Checkout success signature.
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET).
 * Uses timing-safe comparison.
 */
export function verifyCheckoutSignature(args: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${args.razorpayOrderId}|${args.razorpayPaymentId}`)
    .digest("hex");

  return safeEqual(expected, args.razorpaySignature);
}

/**
 * Verify a Razorpay webhook signature using the webhook secret.
 * Body must be the raw request body string (NOT re-serialised JSON).
 */
export function verifyWebhookSignature(args: {
  rawBody: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(args.rawBody)
    .digest("hex");

  return safeEqual(expected, args.signature);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
