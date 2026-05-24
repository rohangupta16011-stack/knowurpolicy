import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Supabase OAuth redirect target. Exchanges the ?code= for a session cookie,
// then bounces the user back to wherever they came from (?next=...).
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const errorParam = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  // Resolve `next` against the request origin so we can't be tricked into an open redirect.
  const target = new URL(next.startsWith("/") ? next : "/", url.origin);

  if (errorParam) {
    target.searchParams.set("auth_error", errorParam);
    return NextResponse.redirect(target);
  }

  if (!code) {
    target.searchParams.set("auth_error", "missing_code");
    return NextResponse.redirect(target);
  }

  try {
    const supabase = supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error(`[auth/callback] exchange failed: ${error.message}`);
      target.searchParams.set("auth_error", error.message);
      return NextResponse.redirect(target);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error(`[auth/callback] unexpected: ${msg}`);
    target.searchParams.set("auth_error", "callback_failed");
    return NextResponse.redirect(target);
  }

  return NextResponse.redirect(target);
}
