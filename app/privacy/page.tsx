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
    <LegalPageLayout title="Privacy Policy" lastUpdated="May 24, 2026">
      <Note>
        Plain English version of what we do with your data. The short answer:{" "}
        <strong>almost nothing</strong> — your documents are analysed in memory
        and discarded the moment the analysis is returned to your browser.
      </Note>

      <H2>1. Who we are</H2>
      <P>
        KnowUrPolicy is an AI-powered document comprehension service operated
        from India. Throughout this policy &quot;we&quot;, &quot;us&quot;, and
        &quot;KnowUrPolicy&quot; refer to KnowUrPolicy. For correspondence,
        use the{" "}
        <Link
          href="/contact"
          className="text-amber underline-offset-2 hover:underline"
        >
          contact page
        </Link>
        .
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
        database, log, backup, or training dataset. Follow-up questions you ask
        about a document are answered using the document text that was returned
        to your browser — the text is sent back with each question and discarded
        again once we reply. Anthropic processes the text under their{" "}
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
          <strong>Email address</strong>, which you provide before each
          analysis. We use it to (a) enforce the one-free-analysis-per-email
          fair-use limit, (b) associate paid credits with your account, and
          (c) attach downloadable PDFs to your purchase record.
        </li>
        <li>
          <strong>Google account profile</strong> (name, email, profile photo)
          if you sign in with Google to download an analysis as a PDF. We
          receive this from Google via Supabase Auth and use it only to
          identify your account.
        </li>
        <li>
          <strong>Usage counts</strong> — how many analyses you have run and
          how many paid credits remain. We store the count, not the documents.
        </li>
        <li>
          <strong>Payment records</strong> — order ID, amount, currency,
          country, and payment status returned by Razorpay. We never see or
          store your card details, UPI ID, bank credentials, or any other
          payment instrument data. All payment processing is performed by
          Razorpay under their{" "}
          <a
            href="https://razorpay.com/privacy/"
            className="text-amber underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy policy
          </a>
          .
        </li>
        <li>
          <strong>Approximate location</strong> — country-level only, derived
          from your IP address at the edge by our hosting provider (Vercel).
          Used to show the right currency and price at checkout. We do not
          store IP addresses.
        </li>
        <li>
          <strong>Analytics</strong> — anonymised page view data via Google
          Analytics 4 with IP anonymisation enabled. Used to understand which
          pages are working. No personally identifiable information.
        </li>
      </Ul>

      <H2>4. What we never do</H2>
      <Ul>
        <li>We never sell your data to third parties.</li>
        <li>
          We never use your documents (or any data derived from them) to train
          AI models — ours or anyone else&apos;s.
        </li>
        <li>
          We never share your email or account data outside of the essential
          service providers listed in Section 8.
        </li>
        <li>We never read, archive, or back up your uploaded documents.</li>
        <li>We never store your card or UPI details — Razorpay handles all payments.</li>
      </Ul>

      <H2>5. Your rights</H2>
      <P>
        Depending on where you live, you have rights over the personal data we
        hold about you. Indian users have rights under the Digital Personal
        Data Protection Act, 2023 (DPDP Act). EU/UK users have GDPR rights.
        California users have CCPA rights.
      </P>
      <Ul>
        <li>
          <strong>Right of access</strong> — request a copy of the data we
          hold (typically: your email, sign-in details, usage count, and
          payment history).
        </li>
        <li>
          <strong>Right of erasure</strong> — request deletion of your data.
          We&apos;ll delete your email, usage history, and Google account link
          on request. Payment records are retained only as required by
          applicable tax / accounting law.
        </li>
        <li>
          <strong>Right to rectification</strong> — correct inaccurate data.
        </li>
        <li>
          <strong>Right to portability</strong> — receive your data in a
          machine-readable format.
        </li>
        <li>
          <strong>Right to object / withdraw consent</strong> — opt out of
          processing for legitimate-interest grounds.
        </li>
      </Ul>
      <P>
        To exercise any of these rights, email us via the{" "}
        <Link href="/contact" className="text-amber underline-offset-2 hover:underline">
          contact page
        </Link>{" "}
        with the subject &quot;Data request&quot;. We respond within 30 days.
      </P>

      <H2>6. Cookies and tracking</H2>
      <P>
        We use a single first-party analytics cookie (Google Analytics 4) with
        IP anonymisation enabled, and authentication cookies set by Supabase
        when you sign in with Google. We do not use advertising cookies or
        third-party trackers. We do not sell your information for advertising
        purposes.
      </P>

      <H2>7. Data retention</H2>
      <Ul>
        <li>
          <strong>Uploaded documents:</strong> zero retention. Discarded
          immediately after analysis.
        </li>
        <li>
          <strong>Analysis results:</strong> zero retention server-side. Held
          only in your browser session (and in your downloaded PDF, if you
          chose to download one).
        </li>
        <li>
          <strong>Email + Google sign-in:</strong> retained while you have an
          active account, or until you request deletion.
        </li>
        <li>
          <strong>Usage counts:</strong> retained while your account is
          active; aggregated anonymously for capacity planning after deletion.
        </li>
        <li>
          <strong>Payment records:</strong> retained for the period required by
          Indian tax and accounting law (currently 8 years for GST / Income
          Tax records).
        </li>
      </Ul>

      <H2>8. Service providers we use</H2>
      <P>
        We share the minimum necessary data with the following processors:
      </P>
      <Ul>
        <li>
          <strong>Anthropic</strong> (AI analysis) — the extracted document
          text, processed under zero-retention terms.
        </li>
        <li>
          <strong>LlamaParse / LlamaIndex</strong> (PDF text extraction) — the
          uploaded PDF file, processed and discarded.
        </li>
        <li>
          <strong>Razorpay</strong> (payments) — your email, payment amount,
          and order metadata. Razorpay collects card / UPI details directly
          from you in its hosted checkout; we never see them.
        </li>
        <li>
          <strong>Supabase</strong> (account database and Google sign-in) —
          your email, Google account ID, profile metadata, usage count, and
          payment record.
        </li>
        <li>
          <strong>Google</strong> (sign-in only) — your Google profile data is
          shared with us when you choose to sign in with Google.
        </li>
        <li>
          <strong>Vercel</strong> (hosting) — operational data needed to serve
          the site (request metadata, no document content).
        </li>
        <li>
          <strong>Google Analytics 4</strong> (analytics) — anonymised page
          views.
        </li>
      </Ul>

      <H2>9. International transfers</H2>
      <P>
        KnowUrPolicy is operated from India. Our infrastructure providers
        (Vercel, Supabase, Anthropic, LlamaParse, Google) may process data in
        the United States, the European Union, or other regions. For EU/UK
        users, we rely on standard contractual clauses and the EU-US Data
        Privacy Framework for these transfers. Because documents are not
        stored, the practical residency exposure is limited to the brief
        processing window (~30 seconds).
      </P>

      <H2>10. Children</H2>
      <P>
        KnowUrPolicy is not directed at children under 16 (or 18 where local
        law requires a higher minimum age). We do not knowingly collect data
        from children. If you believe a child has provided us data, contact us
        and we will delete it.
      </P>

      <H2>11. Security</H2>
      <P>
        All traffic is served over HTTPS / TLS 1.2+. Document processing
        happens entirely in memory and is discarded after each request.
        Payment processing is handled by Razorpay, which is PCI-DSS Level 1
        certified. Account credentials are managed by Supabase Auth — we
        never see or store your Google password.
      </P>

      <H2>12. Changes to this policy</H2>
      <P>
        If we change how we handle data we will update this page and bump the
        &quot;Last updated&quot; date at the top. Material changes will be
        notified via email to active account holders.
      </P>

      <H2>13. Contact</H2>
      <P>
        For any privacy question or data request, use the{" "}
        <Link href="/contact" className="text-amber underline-offset-2 hover:underline">
          contact page
        </Link>
        .
      </P>

      <Note>
        This policy reflects the product&apos;s current data practices in
        plain English. It should be reviewed by a qualified attorney before
        material expansion of data collection or before launch in regulated
        markets.
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
