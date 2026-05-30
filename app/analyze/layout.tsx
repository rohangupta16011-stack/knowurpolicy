import type { Metadata } from "next";

// Unique metadata for /analyze. The page itself is a client component and
// can't export `metadata`, so a route-level layout wraps it and provides it.
// Distinct title + description avoids the duplicate-content SEO issue
// flagged in the v2 audit.

export const metadata: Metadata = {
  // String here is composed via the root layout's title template
  // (`%s — KnowUrPolicy`), so just provide the page-specific portion.
  title: "Upload a Rental Agreement, Contract or Policy",
  description:
    "Sign in with Google, upload your PDF, and get a plain-English clause-by-clause breakdown in 30 seconds. First analysis free; ₹99 each after.",
  alternates: { canonical: "/analyze" },
};

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
