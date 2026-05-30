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
    q: "Do I need an account?",
    a: "Yes — you sign in with your Google account so your free credit, paid analyses, and any add-ons stay attached to one identity. No password to remember, no separate signup form.",
  },
  {
    q: "What happens after my free analysis?",
    a: "Your first analysis is free, no card required. After that, additional analyses are paid per document at your regional price. There's no subscription — you only pay when you upload another document.",
  },
  {
    q: "What do I see on screen vs. in the PDF?",
    a: "On screen you get a preview: the complexity score, the plain-English summary, and the first item from each clause section. The full report — every clause, every risk, every deadline — is in the downloadable PDF, available as a small one-time add-on.",
  },
  {
    q: "How does Q&A pricing work?",
    a: "After your free analysis you get one follow-up question on the document at no charge. Need more? A bundle of 5 additional questions is available as a small one-time add-on at the same regional price.",
  },
  {
    q: "Why does the price differ by region?",
    a: "We charge in your local currency at a tier suited to your market — Indian users pay in ₹, customers in the US/UK/EU/AU pay in USD, and emerging markets get a discounted USD rate. This keeps the product accessible regardless of where you live.",
  },
];

export const META_TITLE =
  "KnowUrPolicy — AI Rental Agreement & Contract Analyser for India (Free First Doc)";

export const META_DESCRIPTION =
  "Upload your rental agreement, employment contract, insurance policy, or any legal PDF and get a plain-English clause-by-clause breakdown in 30 seconds. Free first doc; ₹99 each after. India-first.";

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
