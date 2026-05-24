// LlamaParse integration for PDF → plain text extraction.
// Async API: upload PDF, poll until ready, fetch markdown result.
// Docs: https://docs.cloud.llamaindex.ai/llamaparse/getting_started

const LLAMAPARSE_BASE = "https://api.cloud.llamaindex.ai/api/v1/parsing";

export type ExtractionResult =
  | { ok: true; text: string }
  | { ok: false; reason: "no_text_layer" | "too_short" | "extraction_failed"; detail?: string };

const MIN_USEFUL_CHARS = 500; // per PRD §10 — anything shorter isn't a policy
const NO_TEXT_LAYER_THRESHOLD = 100; // per PRD §10 — scanned image PDFs

export async function extractPdfText(
  fileBuffer: Buffer,
  filename: string,
): Promise<ExtractionResult> {
  const apiKey = process.env.LLAMAPARSE_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "extraction_failed",
      detail: "LLAMAPARSE_API_KEY not configured",
    };
  }

  try {
    const jobId = await uploadJob(fileBuffer, filename, apiKey);
    await waitForJob(jobId, apiKey);
    const text = await fetchResult(jobId, apiKey);

    if (text.length < NO_TEXT_LAYER_THRESHOLD) {
      console.warn(`[extract] no_text_layer: ${filename} (${text.length} chars)`);
      return { ok: false, reason: "no_text_layer" };
    }
    if (text.length < MIN_USEFUL_CHARS) {
      console.warn(`[extract] too_short: ${filename} (${text.length} chars)`);
      return { ok: false, reason: "too_short" };
    }

    console.log(`[extract] ok: ${filename} (${text.length} chars)`);
    return { ok: true, text };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error(`[extract] FAILED: ${filename} — ${detail}`);
    return { ok: false, reason: "extraction_failed", detail };
  }
}

async function uploadJob(
  buffer: Buffer,
  filename: string,
  apiKey: string,
): Promise<string> {
  const form = new FormData();
  // Node 20+ Blob is global. Copy into a fresh ArrayBuffer to satisfy the
  // BlobPart typing (which rejects SharedArrayBuffer-backed views).
  const ab = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(ab).set(buffer);
  form.append("file", new Blob([ab], { type: "application/pdf" }), filename);
  form.append("result_type", "markdown");
  // Fast mode — skips the LLM-based parser that adds 15-30s per request.
  // We were hitting Vercel's 60s function cap. Trade-off: weaker handling of
  // complex tables / forms, but the text-layer extraction is unchanged so
  // ordinary policies / contracts come through fine.
  form.append("parse_mode", "parse_page_without_llm");

  const res = await fetch(`${LLAMAPARSE_BASE}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`llamaparse upload ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function waitForJob(jobId: string, apiKey: string): Promise<void> {
  // 25s budget for parsing. Fast mode usually returns in 3-8s; this leaves
  // ~30s for Claude inside the function's 60s Vercel cap.
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    const res = await fetch(`${LLAMAPARSE_BASE}/job/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      throw new Error(`llamaparse status ${res.status}`);
    }
    const data = (await res.json()) as { status: string };
    if (data.status === "SUCCESS") return;
    if (data.status === "ERROR" || data.status === "CANCELED") {
      throw new Error(`llamaparse job ${data.status}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("llamaparse timeout");
}

async function fetchResult(jobId: string, apiKey: string): Promise<string> {
  // Fast mode (parse_page_without_llm) doesn't generate markdown, so the
  // /result/markdown endpoint 404s. Try markdown first, fall back to text,
  // so this keeps working whichever parse mode is set on upload.
  const headers = { Authorization: `Bearer ${apiKey}` };

  const mdRes = await fetch(
    `${LLAMAPARSE_BASE}/job/${jobId}/result/markdown`,
    { headers },
  );
  if (mdRes.ok) {
    const data = (await mdRes.json()) as { markdown?: string };
    if (data.markdown) return data.markdown;
  } else if (mdRes.status !== 404) {
    throw new Error(`llamaparse result ${mdRes.status}`);
  }

  const txtRes = await fetch(
    `${LLAMAPARSE_BASE}/job/${jobId}/result/text`,
    { headers },
  );
  if (!txtRes.ok) {
    throw new Error(`llamaparse text ${txtRes.status}`);
  }
  const txtData = (await txtRes.json()) as { text?: string };
  return txtData.text ?? "";
}
