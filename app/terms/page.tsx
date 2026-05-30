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
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="May 24, 2026"
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Terms of Service", path: "/terms" },
      ]}
    >
      <Note>
        Two-sentence version: KnowUrPolicy helps you understand what your
        documents say. <strong>It is not legal advice and not a substitute
        for an attorney</strong> — for decisions with legal consequences,
        consult a qualified professional.
      </Note>

      <H2>1. Acceptance of these terms</H2>
      <P>
        By uploading a document to KnowUrPolicy, you agree to these terms and
        to the{" "}
        <Link href="/privacy" className="text-amber underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        ,{" "}
        <Link href="/refunds" className="text-amber underline-offset-2 hover:underline">
          Refund &amp; Cancellation Policy
        </Link>
        , and{" "}
        <Link href="/delivery" className="text-amber underline-offset-2 hover:underline">
          Delivery Policy
        </Link>
        . If you do not agree, do not use the service.
      </P>

      <H2>2. What KnowUrPolicy is</H2>
      <P>
        KnowUrPolicy is an AI-powered document comprehension tool operated
        from India. You upload a policy, contract, or legal document; we
        return a plain-English breakdown of what the document says, including
        coverage, exclusions, deadlines, obligations, and clauses that warrant
        attention. You can ask follow-up questions about the document and
        optionally download a formatted PDF of the analysis.
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
        <li>You are at least 18 years old, or the age of majority in your jurisdiction.</li>
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
          We process your data in compliance with applicable law (India&apos;s
          Digital Personal Data Protection Act 2023, GDPR for EU users, CCPA
          for California users).
        </li>
      </Ul>

      <H2>6. Pricing and payments</H2>
      <P>
        KnowUrPolicy uses a pay-per-document model with region-aware pricing
        in your local currency. Current pricing:
      </P>
      <Ul>
        <li>
          <strong>First analysis</strong> — free with email registration (one
          per email address).
        </li>
        <li>
          <strong>Additional analyses</strong> — ₹99 (India), $2.99 (United
          States, European Union, United Kingdom), or $1.49 (rest of world)
          per document.
        </li>
        <li>
          <strong>Downloadable PDF of an analysis</strong> — ₹49 (India),
          $1.49 (United States, European Union, United Kingdom), or $1.00
          (rest of world) per download.
        </li>
      </Ul>
      <P>
        All payments are processed by Razorpay Software Private Limited
        (&quot;Razorpay&quot;). By making a payment you agree to Razorpay&apos;s{" "}
        <a
          href="https://razorpay.com/terms/"
          className="text-amber underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          terms
        </a>{" "}
        and{" "}
        <a
          href="https://razorpay.com/privacy/"
          className="text-amber underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          privacy policy
        </a>
        . We never see or store your card, UPI, netbanking, or wallet
        credentials. Prices are shown inclusive of any applicable taxes at the
        point of purchase. We reserve the right to update pricing prospectively
        — pricing changes do not affect orders already placed.
      </P>

      <H2>7. Refunds and cancellations</H2>
      <P>
        Refunds and cancellations are governed by our{" "}
        <Link href="/refunds" className="text-amber underline-offset-2 hover:underline">
          Refund &amp; Cancellation Policy
        </Link>
        . In summary: analyses and PDFs are digital goods delivered
        immediately, so they are generally non-refundable; however, if the
        analysis fails to generate or is materially defective we will refund
        the relevant charge.
      </P>

      <H2>8. Delivery of digital goods</H2>
      <P>
        See our{" "}
        <Link href="/delivery" className="text-amber underline-offset-2 hover:underline">
          Delivery Policy
        </Link>
        . In summary: there is no physical shipment. Analyses are delivered
        in your browser within ~30 seconds of upload, and PDF downloads are
        made available immediately upon successful payment.
      </P>

      <H2>9. Service availability</H2>
      <P>
        We aim for high availability but do not guarantee uninterrupted
        service. We may modify, suspend, or discontinue any part of the
        service at any time. We are not liable for downtime, maintenance
        windows, or third-party outages (Anthropic API, Vercel, LlamaParse,
        Razorpay, Supabase, etc.).
      </P>

      <H2>10. Limitation of liability</H2>
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
        in the 12 months preceding the claim, or (b) ₹4,000 (Indian Rupees
        Four Thousand) / USD 50.
      </P>
      <P>
        Some jurisdictions do not allow the exclusion or limitation of certain
        damages. In those jurisdictions, the limitations above apply to the
        maximum extent permitted by law. Nothing in these terms limits
        liability that cannot be limited by applicable law (including
        liability for fraud, gross negligence, or wilful misconduct).
      </P>

      <H2>11. Intellectual property</H2>
      <P>
        You retain all rights to the documents you upload. We claim no
        ownership of your documents or of the analysis produced from them.
        KnowUrPolicy retains all rights to the software, design system, brand,
        and analysis methodology.
      </P>

      <H2>12. Termination</H2>
      <P>
        You can stop using KnowUrPolicy at any time. We can suspend or
        terminate access for misuse, abuse, fraudulent payment activity, or
        breach of these terms. Upon termination, your stored data (email,
        usage count, account record) will be deleted on request — see the{" "}
        <Link href="/privacy" className="text-amber underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        .
      </P>

      <H2>13. Governing law and disputes</H2>
      <P>
        These terms are governed by the laws of India. Any dispute arising
        out of or relating to these terms or your use of KnowUrPolicy will be
        subject to the exclusive jurisdiction of the courts at Bengaluru,
        Karnataka, India, without prejudice to any mandatory consumer
        protection rights you may have under the laws of your country of
        residence.
      </P>

      <H2>14. Changes to these terms</H2>
      <P>
        We may update these terms from time to time. The &quot;Last
        updated&quot; date at the top reflects the most recent revision.
        Material changes will be communicated to active accounts by email.
      </P>

      <H2>15. Contact</H2>
      <P>
        Questions about these terms? Use the{" "}
        <Link href="/contact" className="text-amber underline-offset-2 hover:underline">
          contact page
        </Link>
        .
      </P>
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
