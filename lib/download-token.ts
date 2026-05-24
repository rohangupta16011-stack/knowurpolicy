import crypto from "node:crypto";

// Short-lived HMAC token granting a single PDF download after a successful
// "download" payment. The token doesn't depend on any database — it's
// signed with RAZORPAY_KEY_SECRET (always present in the server env when
// payments work) and expires after the configured TTL.
//
// Token format: `${email}.${expiresAtMs}.${signature}` where the signature
// is HMAC-SHA256 over the same string minus the signature, hex-encoded.

const TTL_MS = 10 * 60 * 1000; // 10 minutes — enough for a slow download + retry

function secret(): string {
  const s = process.env.RAZORPAY_KEY_SECRET;
  if (!s) throw new Error("RAZORPAY_KEY_SECRET not set");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function issueDownloadToken(email: string): string {
  const expiresAt = Date.now() + TTL_MS;
  const payload = `${email}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export type TokenResult =
  | { valid: true; email: string }
  | { valid: false; reason: "malformed" | "expired" | "bad_signature" };

export function verifyDownloadToken(token: string): TokenResult {
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false, reason: "malformed" };
  const [email, expiresAtStr, signature] = parts;
  if (!email || !expiresAtStr || !signature) {
    return { valid: false, reason: "malformed" };
  }

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt)) {
    return { valid: false, reason: "malformed" };
  }
  if (Date.now() > expiresAt) {
    return { valid: false, reason: "expired" };
  }

  const expected = sign(`${email}.${expiresAtStr}`);
  // Timing-safe compare
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return { valid: false, reason: "bad_signature" };
  }

  return { valid: true, email };
}
