import { NextRequest, NextResponse } from "next/server";
import { analyseDocument } from "@/lib/claude";
import { issueDownloadToken } from "@/lib/download-token";
import { isDisposableEmail, normalizeEmail } from "@/lib/email-normalize";
import { extractPdfText } from "@/lib/pdf-extract";
import { getPricingForCountry } from "@/lib/pricing";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024; // 10MB per PRD §6.2
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FREE_PER_IP_PER_DAY = 3;

function clientIp(req: NextRequest): string {
  // Vercel forwards the client IP here. Fall back to x-forwarded-for so the
  // logic works in any reverse-proxy setup. "unknown" only happens for
  // local dev / direct loopback calls; we still gate those.
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch((e) => {
    console.error(`[analyze] formData parse failed: ${e instanceof Error ? e.message : e}`);
    return null;
  });
  if (!form) {
    return NextResponse.json(
      {
        error: "unsupported_type",
        message: "We couldn't read the upload. Please try again.",
      },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        error: "no_file",
        message: "No file was attached to the request. Please reselect and try again.",
      },
      { status: 400 },
    );
  }

  // Email gate — required per the freemium gate (PRD §6.5).
  const emailRawValue = form.get("email");
  const emailInput = typeof emailRawValue === "string" ? emailRawValue.trim() : "";
  if (!emailInput || !EMAIL_RE.test(emailInput.toLowerCase()) || emailInput.length > 254) {
    return NextResponse.json(
      {
        error: "missing_email",
        message: "Please enter a valid email address to continue.",
      },
      { status: 400 },
    );
  }
  // Canonical form used as the DB key. Catches `me+x@gmail.com` /
  // `M.E@gmail.com` / `me@googlemail.com` collisions.
  const email = normalizeEmail(emailInput);

  // Disposable address block — kills the easiest abuse vector (spin up a
  // throwaway inbox per upload to get unlimited free analyses).
  if (isDisposableEmail(email)) {
    console.warn(`[analyze] rejected disposable email: ${email}`);
    return NextResponse.json(
      {
        error: "disposable_email",
        message:
          "Disposable email addresses aren't supported. Please use a permanent email so we can attribute your free analysis correctly.",
      },
      { status: 400 },
    );
  }
  console.log(`[analyze] ${email} @ ${new Date().toISOString()} (${file.name}, ${file.size}B)`);

  // Freemium gate — enforced only when Supabase is configured. Without it
  // we let every upload through (degraded mode, useful in dev before
  // Supabase is wired). With Supabase, atomic SQL function decides whether
  // this is a free analysis, paid, or needs payment.
  // We track the credit type because paid users get the full on-screen
  // report + an included PDF download token (no extra ₹49 paywall) -- see
  // the response below.
  let creditType: "free" | "paid" = "free";
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
      } else if (data === "paid") {
        creditType = "paid";
      } else if (data === "free") {
        // IP-level backstop: limits unique abusers spinning up many emails
        // from the same network. Only triggers on the free path; paid users
        // are not rate-limited by IP.
        const ip = clientIp(req);
        const { data: ipOk, error: ipError } = await supabaseAdmin().rpc(
          "check_and_consume_free_for_ip",
          { p_ip: ip, p_max: MAX_FREE_PER_IP_PER_DAY },
        );
        if (ipError) {
          console.error(`[analyze] ip gate rpc failed: ${ipError.message}`);
        } else if (ipOk === false) {
          console.warn(`[analyze] ip rate limit hit: ${ip} on ${email}`);
          return NextResponse.json(
            {
              error: "rate_limited",
              message:
                "Too many free analyses from your network today. Please come back tomorrow, or pay for an analysis to continue now.",
            },
            { status: 429 },
          );
        }
      }
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
    // Region-aware pricing for the post-analysis "Got another document?" CTA.
    // Detected from Vercel's edge header so the client doesn't have to know
    // the country (and so we can show only the user's price, not every tier).
    const country = req.headers.get("x-vercel-ip-country");
    const pricing = getPricingForCountry(country);
    // Paid analyses get the PDF download bundled in -- no extra paywall.
    // Issue the token here so the client can render a one-click download
    // straight from the results page. Free users still hit the Razorpay
    // paywall to upgrade to a PDF.
    const downloadToken = creditType === "paid" ? issueDownloadToken(email) : null;
    // Return the extracted document text alongside the analysis. The client
    // holds it in session memory to power follow-up Q&A without re-uploading
    // (per PRD §6.4). Server stays zero-retention (§6.6) — the text is not
    // persisted anywhere, it just round-trips through the user's browser.
    return NextResponse.json({
      analysis,
      documentText: extracted.text,
      pricing,
      creditType,
      downloadToken,
    });
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
