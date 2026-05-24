import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/email-normalize";

export const runtime = "nodejs";

// Minimal email regex — server is the truth, but we still hint the client
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const emailInput = body?.email?.trim() ?? "";
  const email = emailInput ? normalizeEmail(emailInput) : "";

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "invalid_email", message: "Enter a valid email address." },
      { status: 400 },
    );
  }

  // TODO: persist to Supabase once the schema is set up.
  // For now we log so the email isn't silently dropped, and respond ok.
  console.log(`[waitlist] ${email} @ ${new Date().toISOString()}`);

  return NextResponse.json({ ok: true });
}
