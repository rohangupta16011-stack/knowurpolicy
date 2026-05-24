import { DISPOSABLE_EMAIL_DOMAINS } from "./disposable-domains";

/**
 * Canonicalise an email address before using it as a database key so a single
 * person can't impersonate multiple "users" via well-known address tricks:
 *
 *   me+test@gmail.com   -> me@gmail.com         (plus-addressing, all providers)
 *   M.E+test@gmail.com  -> me@gmail.com         (Gmail dot trick + lowercase)
 *   me@googlemail.com   -> me@gmail.com         (Gmail's alternate domain)
 *
 * The original (untrimmed) address is still what we hand to Razorpay / display
 * back to the user — this normalization is for STORAGE keys only.
 */
export function normalizeEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const atIdx = trimmed.lastIndexOf("@");
  if (atIdx <= 0 || atIdx === trimmed.length - 1) return trimmed;

  let local = trimmed.slice(0, atIdx);
  let domain = trimmed.slice(atIdx + 1);

  // Strip plus-addressing on every provider.
  const plusIdx = local.indexOf("+");
  if (plusIdx !== -1) local = local.slice(0, plusIdx);

  // Gmail's alternate domain points at the same inbox.
  if (domain === "googlemail.com") domain = "gmail.com";

  // Gmail ignores dots in the local part.
  if (domain === "gmail.com") local = local.replace(/\./g, "");

  return `${local}@${domain}`;
}

/**
 * True if the domain is a known throwaway / disposable email provider. Used
 * to reject the freemium gate at signup time — the cost of letting them
 * through is real (~$0.01-0.05 per analysis) and disposable addresses
 * defeat any per-email rate limit by design.
 */
export function isDisposableEmail(email: string): boolean {
  const atIdx = email.lastIndexOf("@");
  if (atIdx <= 0) return false;
  const domain = email.slice(atIdx + 1).toLowerCase();
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}
