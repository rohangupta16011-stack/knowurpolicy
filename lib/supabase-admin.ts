import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side admin client using the SERVICE_ROLE_KEY. Bypasses Row Level
// Security, so use it ONLY inside server-only contexts (API routes, server
// actions, server components). Never import this from a "use client" file —
// the service role key would leak to the browser.
//
// We construct lazily so the app doesn't crash at import time when env vars
// aren't set (e.g. local dev before someone runs the Supabase setup).

let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
