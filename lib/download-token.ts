import crypto from "node:crypto";

// Short-lived HMAC token granting a single PDF download after a successful
// "download" payment. The token doesn't depend on any database — it's
// signed with RAZORPAY_KEY_SECRET (always present in the server env when
// payments work) and expires after the configured TTL.
//
// Token format: `${email}.${expiresAtMs}.${signature}` where the signature
// is HMAC-SHA256 over the same string minus the signature, hex-encoded.

// 60 min window. Long enough that paid-analysis users (who get the token at
// analysis time, not at a separate payment) have time to read the on-screen
// report before grabbing the PDF. Free users who pay ₹49 download
// immediately, so 60 min is generous either way.
const TTL_MS = 60 * 60 * 1000;

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
  // Email can contain dots (e.g. rohan.gupta190@gmail.com), so split from the
  // right: last segment is signature, segment before it is expiresAt, and
  // everything earlier is the email (which may itself contain dots).
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return { valid: false, reason: "malformed" };
  const signature = token.slice(lastDot + 1);
  const beforeSig = token.slice(0, lastDot);

  const secondLastDot = beforeSig.lastIndexOf(".");
  if (secondLastDot <= 0) return { valid: false, reason: "malformed" };
  const expiresAtStr = beforeSig.slice(secondLastDot + 1);
  const email = beforeSig.slice(0, secondLastDot);

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
