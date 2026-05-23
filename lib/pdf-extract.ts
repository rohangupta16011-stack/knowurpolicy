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
  const deadline = Date.now() + 45_000; // PRD §6.2 — 45s soft limit
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
  const res = await fetch(`${LLAMAPARSE_BASE}/job/${jobId}/result/markdown`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`llamaparse result ${res.status}`);
  }
  const data = (await res.json()) as { markdown: string };
  return data.markdown ?? "";
}
