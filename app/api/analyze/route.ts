import { NextRequest, NextResponse } from "next/server";
import { analyseDocument } from "@/lib/claude";
import { extractPdfText } from "@/lib/pdf-extract";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024; // 10MB per PRD §6.2
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { error: "unsupported_type", message: "Only PDF files are supported right now." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "unsupported_type", message: "Only PDF files are supported right now." },
      { status: 400 },
    );
  }

  // Email gate — required per the freemium gate (PRD §6.5).
  const emailRaw = form.get("email");
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      {
        error: "missing_email",
        message: "Please enter a valid email address to continue.",
      },
      { status: 400 },
    );
  }
  console.log(`[analyze] ${email} @ ${new Date().toISOString()} (${file.name}, ${file.size}B)`);

  // Freemium gate — enforced only when Supabase is configured. Without it
  // we let every upload through (degraded mode, useful in dev before
  // Supabase is wired). With Supabase, atomic SQL function decides whether
  // this is a free analysis, paid, or needs payment.
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabaseAdmin().rpc(
        "consume_analysis_credit",
        { p_email: email },
      );
      if (error) {
        // Don't block the user on a Supabase outage — log and proceed.
        console.error(`[analyze] gate rpc failed: ${error.message}`);
      } else if (data === "none") {
        return NextResponse.json(
          {
            error: "payment_required",
            message:
              "Your free analysis has been used. Please pay for an additional analysis to continue.",
          },
          { status: 402 },
        );
      }
      // else: "free" or "paid" — credit consumed, proceed to analyse
    } catch (e) {
      console.error(`[analyze] gate failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  // No server-side MIME/extension validation — File objects coming through
  // FormData on Vercel can have empty `name`/`type` depending on how the
  // browser packed the multipart, and we kept rejecting real PDFs because
  // of it. The client already does a soft check for UX; the only thing
  // that truly knows if it's a PDF is the extractor.

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: "file_too_large",
        message: "This file is too large. Please upload a PDF under 10MB.",
      },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extracted = await extractPdfText(buffer, file.name);

  if (!extracted.ok) {
    const userMessage = userMessageForExtractionFailure(extracted.reason);
    // Per PRD §6.6, raw text and the buffer go out of scope here; nothing
    // is persisted.
    return NextResponse.json(
      { error: extracted.reason, message: userMessage },
      { status: 422 },
    );
  }

  try {
    const analysis = await analyseDocument(extracted.text);
    // Return the extracted document text alongside the analysis. The client
    // holds it in session memory to power follow-up Q&A without re-uploading
    // (per PRD §6.4). Server stays zero-retention (§6.6) — the text is not
    // persisted anywhere, it just round-trips through the user's browser.
    return NextResponse.json({ analysis, documentText: extracted.text });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error(`[analyze] model failed for ${file.name}: ${detail}`);
    return NextResponse.json(
      {
        error: "model_failed",
        message: "Something went wrong. Please try again.",
      },
      { status: 502 },
    );
  }
}

function userMessageForExtractionFailure(reason: string): string {
  switch (reason) {
    case "no_text_layer":
      return "This PDF appears to be a scanned image. We cannot analyse image-only files yet.";
    case "too_short":
      return "This document is too short to analyse. Please upload the full document.";
    default:
      // "extraction_failed" — could be password-protected, corrupted, network
      // issue with the extractor, or missing API key. Honest catch-all.
      return "We couldn't extract text from this PDF. If it's password-protected, please remove the password and try again. Otherwise, please try again in a moment.";
  }
}
