import type { Metadata } from "next";

// Unique metadata for /analyze. The page itself is a client component and
// can't export `metadata`, so a route-level layout wraps it and provides it.
// Distinct title + description avoids the duplicate-content SEO issue
// flagged in the v2 audit.

export const metadata: Metadata = {
  // String here is composed via the root layout's title template
  // (`%s — KnowUrPolicy`), so just provide the page-specific portion.
  title: "Upload Your Document",
  description:
    "Drag and drop your policy, contract, or legal document. Get a plain-English breakdown in 30 seconds. Free, private, no account needed.",
  alternates: { canonical: "/analyze" },
};

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
