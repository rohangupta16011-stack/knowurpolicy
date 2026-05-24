import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/claude";
import { normalizeEmail } from "@/lib/email-normalize";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_QUESTION_LEN = 500;
const MAX_DOCUMENT_LEN = 600_000; // ~120K tokens, generous upper bound
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { documentText?: string; question?: string; email?: string }
    | null;

  const question = body?.question?.trim();
  const documentText = body?.documentText;
  const emailInput = body?.email?.trim() ?? "";
  // Canonical form so the QA gate counts the same person consistently
  // regardless of plus-addressing / dot variations.
  const email = emailInput ? normalizeEmail(emailInput) : "";

  if (!question || question.length === 0) {
    return NextResponse.json(
      { error: "missing_question", message: "Please enter a question." },
      { status: 400 },
    );
  }
  if (question.length > MAX_QUESTION_LEN) {
    return NextResponse.json(
      { error: "question_too_long", message: "Please keep questions under 500 characters." },
      { status: 400 },
    );
  }
  if (!documentText || documentText.length === 0) {
    return NextResponse.json(
      {
        error: "missing_document",
        message:
          "Document context missing. Please re-upload the document and try again.",
      },
      { status: 400 },
    );
  }
  if (documentText.length > MAX_DOCUMENT_LEN) {
    return NextResponse.json(
      { error: "document_too_long", message: "Document text is too long." },
      { status: 413 },
    );
  }

  // Q&A gate — 1 free per email lifetime, then bundles of paid credits.
  // Only enforced when Supabase is configured. Without it the route falls
  // through to ungated behaviour so local dev / unwired deployments keep
  // working.
  if (isSupabaseConfigured()) {
    if (!email || !EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json(
        {
          error: "missing_email",
          message: "Please reload the page and ask again so we can attribute your question.",
        },
        { status: 400 },
      );
    }
    try {
      const { data, error } = await supabaseAdmin().rpc("consume_qa_credit", {
        p_email: email,
      });
      if (error) {
        // Supabase outage — don't block the user; log it and proceed.
        console.error(`[qa] gate rpc failed: ${error.message}`);
      } else if (data === "none") {
        return NextResponse.json(
          {
            error: "payment_required",
            message:
              "You've used your free question. Buy a 5-question pack to keep asking.",
          },
          { status: 402 },
        );
      }
      // else 'free' or 'paid' — credit consumed, proceed to answer.
    } catch (e) {
      console.error(`[qa] gate failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  try {
    const answer = await answerQuestion(documentText, question);
    return NextResponse.json({ answer });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error(`[qa] failed: ${detail}`);
    return NextResponse.json(
      {
        error: "model_failed",
        message: "Something went wrong. Please try again.",
      },
      { status: 502 },
    );
  }
}
