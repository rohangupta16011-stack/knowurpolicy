import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { AnalysisPdf } from "@/lib/AnalysisPdf";
import { verifyDownloadToken } from "@/lib/download-token";
import type { AnalysisResult } from "@/lib/types";

// Render-to-PDF is too heavy for the edge runtime (uses node:stream).
export const runtime = "nodejs";
export const maxDuration = 30;

type DownloadBody = {
  token?: string;
  analysis?: AnalysisResult;
  filename?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as DownloadBody | null;
  const token = body?.token;
  const analysis = body?.analysis;
  const filename = body?.filename ?? "analysis.pdf";

  if (!token || !analysis) {
    return NextResponse.json(
      { error: "missing_fields", message: "Token and analysis are required." },
      { status: 400 },
    );
  }

  const result = verifyDownloadToken(token);
  if (!result.valid) {
    return NextResponse.json(
      {
        error: result.reason,
        message:
          result.reason === "expired"
            ? "Your download link expired. Please pay again to generate a new one."
            : "Download token failed to verify.",
      },
      { status: 401 },
    );
  }

  // Render the PDF
  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      AnalysisPdf({
        analysis,
        filename,
        generatedFor: result.email,
      }),
    );
  } catch (e) {
    console.error(
      `[download/pdf] render failed: ${e instanceof Error ? e.message : e}`,
    );
    return NextResponse.json(
      { error: "render_failed", message: "Couldn't generate the PDF. Please try again." },
      { status: 500 },
    );
  }

  // Drop ".pdf" if filename already has it, then re-attach our own.
  const baseName = filename.replace(/\.pdf$/i, "");
  const downloadName = `${baseName} — KnowUrPolicy.pdf`;

  // Coerce Buffer → ArrayBuffer slice for Response body typing
  const ab = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(ab).set(buffer);

  return new Response(ab, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${encodeURIComponent(downloadName)}"`,
      "cache-control": "no-store",
    },
  });
}
