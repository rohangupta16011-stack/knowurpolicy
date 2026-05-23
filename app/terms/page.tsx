import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing your use of KnowUrPolicy. This is a comprehension tool, not legal advice.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="May 23, 2026">
      <Note>
        Two-sentence version: KnowUrPolicy helps you understand what your
        documents say. <strong>It is not legal advice and not a substitute
        for an attorney</strong> — for decisions with legal consequences,
        consult a qualified professional.
      </Note>

      <H2>1. Acceptance of these terms</H2>
      <P>
        By uploading a document to KnowUrPolicy, you agree to these terms. If
        you do not agree, do not use the service.
      </P>

      <H2>2. What KnowUrPolicy is</H2>
      <P>
        KnowUrPolicy is an AI-powered document comprehension tool. You upload
        a policy, contract, or legal document; we return a plain-English
        breakdown of what the document says, including coverage, exclusions,
        deadlines, obligations, and clauses that warrant attention.
      </P>

      <H2>3. What KnowUrPolicy is NOT</H2>
      <Ul>
        <li>
          <strong>Not legal advice.</strong> Nothing produced by KnowUrPolicy
          constitutes legal advice, legal opinion, or recommendation on legal
          decisions. We are not a law firm and we are not your attorney.
        </li>
        <li>
          <strong>Not a substitute for professional review.</strong> Before
          taking any action that has legal consequences — signing, refusing to
          sign, claiming, disputing, or terminating — consult a qualified
          attorney.
        </li>
        <li>
          <strong>Not insurance, financial, or tax advice.</strong> The same
          principle applies to insurance, financial, and tax decisions —
          consult the appropriate licensed professional.
        </li>
        <li>
          <strong>Not a guarantee of accuracy.</strong> AI analysis can miss
          nuance, mischaracterise clauses, or fail to identify issues. Always
          read the original document and consult a professional for
          consequential decisions.
        </li>
      </Ul>

      <H2>4. Your responsibilities</H2>
      <Ul>
        <li>You own or have permission to upload any document you submit.</li>
        <li>
          You do not upload documents that contain third-party confidential
          information you are not authorised to disclose.
        </li>
        <li>
          You use the analysis as a comprehension aid, not as the sole basis
          for any legal, financial, or commercial decision.
        </li>
        <li>
          You do not attempt to reverse-engineer, scrape, or abuse the service
          (rate limits, paywalls, etc.).
        </li>
      </Ul>

      <H2>5. Our responsibilities</H2>
      <Ul>
        <li>
          We do not store your uploaded documents — see the{" "}
          <Link href="/privacy" className="text-amber underline-offset-2 hover:underline">
            Privacy Policy
          </Link>{" "}
          for details.
        </li>
        <li>We do not use your documents to train AI models.</li>
        <li>
          We process your data in compliance with applicable law (GDPR for EU
          users, CCPA for California users).
        </li>
      </Ul>

      <H2>6. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, KnowUrPolicy and its
        contributors are not liable for any indirect, incidental, special,
        consequential, or punitive damages — including but not limited to lost
        profits, lost savings, legal costs, or damages arising from reliance
        on any analysis output.
      </P>
      <P>
        Our aggregate liability for any direct damages arising from your use
        of the service is limited to the greater of (a) the amount you paid us
        in the 12 months preceding the claim, or (b) USD $50.
      </P>
      <P>
        Some jurisdictions do not allow the exclusion or limitation of certain
        damages. In those jurisdictions, the limitations above apply to the
        maximum extent permitted by law.
      </P>

      <H2>7. Service availability</H2>
      <P>
        We aim for high availability but do not guarantee uninterrupted
        service. We may modify, suspend, or discontinue any part of the
        service at any time. We are not liable for downtime, maintenance
        windows, or third-party outages (Anthropic API, Vercel, LlamaParse,
        etc.).
      </P>

      <H2>8. Pricing and payments</H2>
      <P>
        Free tier: one document analysis per email address. Pro tier (when
        launched): paid subscription via Stripe with the terms shown at
        checkout. Subscription terms, refund policy, and cancellation
        mechanics will be disclosed at the point of sale and form part of
        these terms by reference once Pro is live.
      </P>

      <H2>9. Intellectual property</H2>
      <P>
        You retain all rights to the documents you upload. We claim no
        ownership of your documents or of the analysis produced from them.
        KnowUrPolicy retains all rights to the software, design system, brand,
        and analysis methodology.
      </P>

      <H2>10. Termination</H2>
      <P>
        You can stop using KnowUrPolicy at any time. We can suspend or
        terminate access for misuse, abuse, or breach of these terms. Upon
        termination, your stored data (email, usage count) will be deleted on
        request — see the{" "}
        <Link href="/privacy" className="text-amber underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        .
      </P>

      <H2>11. Governing law</H2>
      <P>
        These terms are governed by the laws of the State of Delaware, United
        States, without regard to its conflict of laws principles. Any dispute
        will be resolved in the state or federal courts located in Delaware,
        subject to applicable consumer protection rules in your jurisdiction.
      </P>

      <H2>12. Changes to these terms</H2>
      <P>
        We may update these terms from time to time. The &quot;Last
        updated&quot; date at the top reflects the most recent revision.
        Material changes will be communicated to active accounts by email.
      </P>

      <H2>13. Contact</H2>
      <P>
        Questions about these terms? Use the{" "}
        <Link href="/contact" className="text-amber underline-offset-2 hover:underline">
          contact page
        </Link>
        .
      </P>

      <Note>
        These terms are a working draft for MVP launch. They should be
        reviewed by a qualified attorney before scaling to paid users or
        market launch, particularly the limitation-of-liability and
        governing-law clauses.
      </Note>
    </LegalPageLayout>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 font-display text-2xl font-bold text-navy">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6 marker:text-amber">{children}</ul>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <aside className="rounded-md border border-flag-y-border/40 bg-flag-y-bg px-4 py-3 text-sm leading-relaxed text-flag-y-text">
      {children}
    </aside>
  );
}
