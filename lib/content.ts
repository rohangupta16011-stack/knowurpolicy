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
    a: "Any policy, contract, or legal document: insurance policies, freelance and employment contracts, lease and rental agreements, terms of service, NDAs, EULAs, loan agreements, and more. If it's a PDF with selectable text, we can read it.",
  },
  {
    q: "How accurate is the analysis?",
    a: "Every clause is grounded in your document — we do not fabricate. Anything red-flagged should be reviewed with a professional before you act.",
  },
  {
    q: "What happens after my free analysis?",
    a: "Your first analysis is free, no card required — we just need your email so you can find your analyses again. After that, additional analyses are paid per document. No subscription, no commitment — you only pay when you upload another.",
  },
  {
    q: "Why does the price differ by region?",
    a: "We charge in your local currency at a tier suited to your market — Indian users pay in ₹, customers in the US/UK/EU/AU pay in USD, and emerging markets get a discounted USD rate. This keeps the product accessible regardless of where you live.",
  },
];

export const META_TITLE =
  "KnowUrPolicy — AI Policy, Contract & Legal Document Analyser | Plain English in 30 Seconds";

export const META_DESCRIPTION =
  "Upload any policy, contract, or legal document and get a plain-English breakdown of what's covered, what's excluded, and what puts you at risk — in 30 seconds.";

export const META_KEYWORDS = [
  "AI contract analyser",
  "AI policy analyser",
  "explain legal document plain english",
  "review contract with AI",
  "upload contract for AI review",
  "lease agreement plain english",
  "freelance contract review AI",
  "terms of service explainer",
  "AI document simplification",
  "AI insurance policy analyser",
  "understand any legal document",
];
