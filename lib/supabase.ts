// Browser-safe Supabase helpers used by the client-side sign-in flow.
// Server-side admin client lives in lib/supabase-admin.ts; server-side SSR
// client (for the OAuth code-exchange route) lives in lib/supabase-server.ts.

import { createBrowserClient } from "@supabase/ssr";

// IMPORTANT: read env vars via LITERAL property access (not process.env[name]).
// Next.js only inlines NEXT_PUBLIC_* vars when accessed as static literal
// properties — dynamic lookups stay as undefined in the client bundle and
// silently throw at runtime, taking the page down.
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
  return createBrowserClient(url, key);
}

/**
 * True when the browser-side Supabase env vars are present at build time.
 * Use this to skip auth-gated UI in dev when Supabase isn't wired up —
 * calling supabaseBrowser() would otherwise throw at render time.
 */
export function isSupabaseBrowserConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
