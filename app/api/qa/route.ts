import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_QUESTION_LEN = 500;
const MAX_DOCUMENT_LEN = 600_000; // ~120K tokens, generous upper bound

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { documentText?: string; question?: string }
    | null;

  const question = body?.question?.trim();
  const documentText = body?.documentText;

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
