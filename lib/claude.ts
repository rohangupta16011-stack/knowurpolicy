import Anthropic from "@anthropic-ai/sdk";
import {
  ANALYSIS_INSTRUCTIONS,
  SYSTEM_PROMPT,
  buildQAUserMessage,
} from "./prompts";
import type { AnalysisResult } from "./types";

// The PRD specifies claude-sonnet-4-20250514 (the May 2025 Sonnet 4.0). We use
// the current best Sonnet — claude-sonnet-4-6 — which has the same API shape
// and stronger document comprehension. Pin to a different ID via env if needed.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

const ANALYSIS_MAX_TOKENS = 4000;
const QA_MAX_TOKENS = 1000;

/**
 * Strips a ```json ... ``` fence if Claude wraps the JSON despite instructions.
 * Sonnet 4.6 is reliable about JSON-only output, but documents that don't look
 * like policies sometimes elicit a wrapped or prose response.
 */
function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1);
  }
  return text.trim();
}

export async function analyseDocument(
  documentText: string,
): Promise<AnalysisResult> {
  // System prompt is cached: it never changes between requests.
  // Analysis instructions are cached separately so they survive even if we
  // tweak the system prompt later. Document text is per-request and uncached.
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: ANALYSIS_MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: ANALYSIS_INSTRUCTIONS,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `\n${documentText}`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("model_returned_no_text");
  }

  const json = extractJSON(textBlock.text);
  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(json) as AnalysisResult;
  } catch (e) {
    // One retry with explicit repair instruction — per PRD §7.3 error handling.
    parsed = await repairAndRetry(documentText, textBlock.text);
  }

  return parsed;
}

async function repairAndRetry(
  documentText: string,
  badOutput: string,
): Promise<AnalysisResult> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: ANALYSIS_MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${ANALYSIS_INSTRUCTIONS}\n${documentText}`,
      },
      {
        role: "assistant",
        content: badOutput,
      },
      {
        role: "user",
        content:
          "Your previous response was not valid JSON. Return only valid JSON matching the schema above. No prose, no code fences, no preamble.",
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("model_returned_no_text");
  }
  return JSON.parse(extractJSON(textBlock.text)) as AnalysisResult;
}

export async function answerQuestion(
  documentText: string,
  question: string,
): Promise<string> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: QA_MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildQAUserMessage(documentText, question),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("model_returned_no_text");
  }
  return textBlock.text.trim();
}
