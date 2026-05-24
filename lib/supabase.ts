// Browser-safe Supabase helpers. Per PRD §6.6 the database stores ONLY:
//   - user email (if provided at paywall)
//   - subscription status
//   - usage count (number of analyses, not document content)
// Document text and analysis JSON never touch this client.
//
// The server-side client lives in `lib/supabase-server.ts` so importing this
// module from a Client Component doesn't pull `next/headers` into the
// browser bundle.

import { createBrowserClient } from "@supabase/ssr";

// IMPORTANT: read these via LITERAL property access (not process.env[name]).
// Next.js only inlines NEXT_PUBLIC_* vars when accessed as static literal
// properties — dynamic lookups stay as undefined in the client bundle and
// silently break the page at runtime.
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
  return createBrowserClient(url, key);
}

/**
 * True when the browser-side Supabase env vars are present. Use this to skip
 * auth-gated UI in dev when Supabase isn't wired up yet — calling
 * `supabaseBrowser()` would otherwise throw at render time.
 */
export function isSupabaseBrowserConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
