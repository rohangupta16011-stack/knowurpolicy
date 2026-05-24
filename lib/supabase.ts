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

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} not set`);
  return v;
}

export function supabaseBrowser() {
  return createBrowserClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
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
