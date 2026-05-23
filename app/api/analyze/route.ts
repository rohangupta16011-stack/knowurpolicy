import { NextRequest, NextResponse } from "next/server";
import { analyseDocument } from "@/lib/claude";
import { extractPdfText } from "@/lib/pdf-extract";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024; // 10MB per PRD §6.2

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

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "unsupported_type", message: "Only PDF files are supported right now." },
      { status: 400 },
    );
  }

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
    return NextResponse.json({ analysis });
  } catch (e) {
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
