import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How KnowUrPolicy handles your data. Documents are deleted immediately after analysis. We never train on user data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="May 23, 2026">
      <Note>
        Plain English version of what we do with your data. The short answer:{" "}
        <strong>almost nothing</strong> — your documents are analysed in memory
        and discarded the moment the analysis is returned to your browser.
      </Note>

      <H2>1. Who we are</H2>
      <P>
        KnowUrPolicy is an AI-powered document comprehension service operated
        from the United States. Throughout this policy &quot;we&quot;,
        &quot;us&quot;, and &quot;KnowUrPolicy&quot; refer to KnowUrPolicy.
      </P>

      <H2>2. What we collect about your documents</H2>
      <P>
        <strong>Your uploaded PDF is never stored.</strong> When you upload a
        document we:
      </P>
      <Ul>
        <li>Transmit the file over HTTPS to our server</li>
        <li>
          Extract the text and send it to our AI analysis provider (Anthropic)
        </li>
        <li>Return the structured analysis to your browser</li>
        <li>
          Immediately discard the file and extracted text from server memory
        </li>
      </Ul>
      <P>
        Neither the uploaded file nor the extracted text is written to any
        database, log, backup, or training dataset. Anthropic processes the
        text under their{" "}
        <a
          href="https://www.anthropic.com/legal/privacy"
          className="text-amber underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          zero-retention API policy
        </a>{" "}
        for document analysis.
      </P>

      <H2>3. What we do collect</H2>
      <Ul>
        <li>
          <strong>Email address</strong>, only if you provide it (e.g. to join
          the Pro waitlist or to create an account once paid tiers launch).
        </li>
        <li>
          <strong>Usage counts</strong> — how many analyses you have run, so we
          can enforce the free-tier limit. We store the count, not the
          documents.
        </li>
        <li>
          <strong>Analytics</strong> — anonymised page view data via Google
          Analytics 4 with IP anonymisation enabled. Used to understand which
          pages are working. No personally identifiable information.
        </li>
        <li>
          <strong>Payment information</strong> — once Pro is live, payments are
          processed entirely by Stripe. We never see or store your card
          details.
        </li>
      </Ul>

      <H2>4. What we never do</H2>
      <Ul>
        <li>We never sell your data to third parties.</li>
        <li>
          We never use your documents (or any data derived from them) to train
          AI models — ours or anyone else&apos;s.
        </li>
        <li>We never share your email outside of essential service providers.</li>
        <li>
          We never read, archive, or back up your uploaded documents.
        </li>
      </Ul>

      <H2>5. Your rights</H2>
      <P>
        Depending on where you live, you have rights over the personal data we
        hold about you:
      </P>
      <Ul>
        <li>
          <strong>Right of access</strong> — request a copy of the data we hold
          (typically: your email and usage count).
        </li>
        <li>
          <strong>Right of erasure</strong> — request deletion of your data.
          For accounts, this removes your email and usage history.
        </li>
        <li>
          <strong>Right to rectification</strong> — correct inaccurate data.
        </li>
        <li>
          <strong>Right to portability</strong> — receive your data in a
          machine-readable format.
        </li>
        <li>
          <strong>Right to object</strong> — opt out of processing for
          legitimate-interest grounds.
        </li>
      </Ul>
      <P>
        Under GDPR (EU/UK) and CCPA (California) these rights are
        statutory. To exercise any of them, email us via the{" "}
        <Link href="/contact" className="text-amber underline-offset-2 hover:underline">
          contact page
        </Link>{" "}
        with the subject &quot;Data request&quot;. We respond within 30 days.
      </P>

      <H2>6. Cookies and tracking</H2>
      <P>
        We use a single first-party analytics cookie (Google Analytics 4) with
        IP anonymisation enabled. We do not use advertising cookies or
        third-party trackers. We do not sell your information for advertising
        purposes (CCPA &quot;Do Not Sell My Personal Information&quot;
        request: see Section 5).
      </P>

      <H2>7. Data retention</H2>
      <Ul>
        <li>
          <strong>Uploaded documents:</strong> zero retention. Discarded
          immediately after analysis.
        </li>
        <li>
          <strong>Analysis results:</strong> zero retention server-side. Held
          only in your browser session.
        </li>
        <li>
          <strong>Email addresses</strong> (waitlist/account): retained while
          you have an active account or until you request deletion.
        </li>
        <li>
          <strong>Usage counts:</strong> rolling 90-day window, then aggregated
          anonymously for capacity planning.
        </li>
      </Ul>

      <H2>8. International transfers</H2>
      <P>
        We are hosted on Vercel (US) and use Anthropic&apos;s Claude API (US).
        For EU users, data may be transferred to the United States. We rely on
        the EU-US Data Privacy Framework and standard contractual clauses for
        these transfers. Because documents are not stored, the practical
        residency exposure is limited to the brief processing window (~30
        seconds).
      </P>

      <H2>9. Children</H2>
      <P>
        KnowUrPolicy is not directed at children under 16. We do not knowingly
        collect data from children. If you believe a child has provided us
        data, contact us and we will delete it.
      </P>

      <H2>10. Changes to this policy</H2>
      <P>
        If we change how we handle data we will update this page and bump the
        &quot;Last updated&quot; date at the top. Material changes will be
        notified via email to active account holders.
      </P>

      <H2>11. Contact</H2>
      <P>
        For any privacy question or data request, use the{" "}
        <Link href="/contact" className="text-amber underline-offset-2 hover:underline">
          contact page
        </Link>
        .
      </P>

      <Note>
        This policy is a working draft for MVP launch. It accurately reflects
        the product&apos;s current data practices but should be reviewed by a
        qualified attorney before scaling to paid users or EU market launch.
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
    <aside className="rounded-md border border-flag-g-text/30 bg-flag-g-bg px-4 py-3 text-sm leading-relaxed text-flag-g-text">
      {children}
    </aside>
  );
}
