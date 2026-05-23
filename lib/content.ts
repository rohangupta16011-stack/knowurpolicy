// Shared content used by both the rendered page and structured data
// (JSON-LD). Keeping these in one place means Google sees the same answers
// as users do — a soft trust signal that also avoids drift.

export const FAQS = [
  {
    q: "Is this legal advice?",
    a: "No. KnowUrPolicy explains what your document says. It does not tell you what to do — that's a job for a licensed attorney.",
  },
  {
    q: "Is my document stored?",
    a: "No. Your file is analysed in memory and discarded the moment the analysis is returned. We never store files or use them to train AI models.",
  },
  {
    q: "What documents work?",
    a: "Insurance policies (health, home, auto, renters) for the MVP. Freelance contracts and lease agreements are next.",
  },
  {
    q: "How accurate is the analysis?",
    a: "Every clause is grounded in your document — we do not fabricate. Anything red-flagged should be reviewed with a professional before you act.",
  },
];

export const META_TITLE =
  "KnowUrPolicy — AI Insurance Policy Analyser | Plain English in 30 Seconds";

export const META_DESCRIPTION =
  "Upload your insurance policy or contract and get a plain-English breakdown of what's covered, what's excluded, and what puts you at risk — in 30 seconds.";

export const META_KEYWORDS = [
  "AI insurance policy analyser",
  "explain insurance policy plain english",
  "insurance policy exclusions",
  "upload contract for AI review",
  "legal document plain english",
  "AI document simplification",
  "understand insurance policy",
  "how to read insurance policy",
];
