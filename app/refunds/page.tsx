import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "When KnowUrPolicy will refund a paid analysis or PDF download. Digital goods, processed via Razorpay.",
  alternates: { canonical: "/refunds" },
};

export default function RefundsPage() {
  return (
    <LegalPageLayout
      title="Refund & Cancellation Policy"
      lastUpdated="May 24, 2026"
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Refund Policy", path: "/refunds" },
      ]}
    >
      <Note>
        Short version: analyses and PDFs are digital goods delivered
        immediately, so they&apos;re generally <strong>non-refundable</strong>.
        But if something genuinely fails on our side — analysis didn&apos;t
        generate, PDF didn&apos;t download, you were charged twice — we&apos;ll
        refund you. Email us within 7 days.
      </Note>

      <H2>1. What this policy covers</H2>
      <P>
        This policy applies to all paid purchases on KnowUrPolicy, including:
      </P>
      <Ul>
        <li>Paid document analyses (after your first free analysis)</li>
        <li>Paid PDF downloads of an analysis</li>
        <li>Any future paid product offered on the site</li>
      </Ul>

      <H2>2. Cancellation</H2>
      <P>
        Because each purchase is a single, one-time transaction that begins
        delivery immediately (the analysis starts running, or the download
        token is issued, within seconds of payment), there is no separate
        cancellation step. There are no recurring subscriptions to cancel.
      </P>

      <H2>3. When refunds are available</H2>
      <P>
        We will refund the full amount paid in the following cases:
      </P>
      <Ul>
        <li>
          <strong>Analysis failed to generate.</strong> You were charged for
          an analysis but the system returned an error and no analysis was
          produced.
        </li>
        <li>
          <strong>PDF failed to download.</strong> You paid for a PDF
          download but the file could not be generated or delivered to your
          browser, and a retry also failed.
        </li>
        <li>
          <strong>Duplicate charge.</strong> You were charged more than once
          for the same purchase due to a technical issue.
        </li>
        <li>
          <strong>Unauthorised charge.</strong> A charge was made on your card
          / UPI / wallet without your authorisation. Please also contact your
          bank to dispute.
        </li>
        <li>
          <strong>Materially defective output.</strong> The returned analysis
          is empty, garbled, or unrelated to your document such that it
          provides no value. We review these case-by-case.
        </li>
      </Ul>

      <H2>4. When refunds are not available</H2>
      <P>
        Because the product is a digital good delivered the moment payment
        succeeds, the following are not grounds for a refund:
      </P>
      <Ul>
        <li>
          You changed your mind after receiving the analysis or PDF.
        </li>
        <li>
          The analysis correctly summarised the document but didn&apos;t say
          what you hoped it would say.
        </li>
        <li>
          You disagree with the AI&apos;s interpretation of a particular
          clause (the analysis is a comprehension aid, not legal advice — see{" "}
          <Link href="/terms" className="text-amber underline-offset-2 hover:underline">
            Terms of Service
          </Link>{" "}
          §3).
        </li>
        <li>
          You uploaded the wrong document and ran the analysis on it.
        </li>
        <li>
          The free first-analysis credit has already been consumed (free
          credits are tracked per email and cannot be reset on demand).
        </li>
      </Ul>

      <H2>5. How to request a refund</H2>
      <P>
        Email us via the{" "}
        <Link href="/contact" className="text-amber underline-offset-2 hover:underline">
          contact page
        </Link>{" "}
        with the subject line &quot;Refund request&quot; and include:
      </P>
      <Ul>
        <li>The email address used at checkout</li>
        <li>The Razorpay Payment ID (starts with <code>pay_</code>) or Order ID</li>
        <li>A short description of what went wrong</li>
      </Ul>
      <P>
        You must request the refund within <strong>7 calendar days</strong>{" "}
        of the original charge. Requests outside this window will not be
        considered except where required by applicable consumer protection
        law.
      </P>

      <H2>6. How refunds are processed</H2>
      <P>
        Approved refunds are processed through Razorpay to the original
        payment method. Once we initiate the refund:
      </P>
      <Ul>
        <li>
          <strong>UPI / wallet</strong> — typically credited within 1–3
          business days.
        </li>
        <li>
          <strong>Cards (domestic)</strong> — typically credited within 5–7
          business days, subject to your card issuer.
        </li>
        <li>
          <strong>Cards (international)</strong> — typically credited within
          5–10 business days, subject to your card issuer and currency
          conversion timelines.
        </li>
        <li>
          <strong>Netbanking</strong> — typically credited within 5–7 business
          days.
        </li>
      </Ul>
      <P>
        We don&apos;t issue partial refunds, store credit, or replacement
        credits in lieu of a cash refund unless you specifically request that.
      </P>

      <H2>7. Chargebacks</H2>
      <P>
        If you dispute a charge directly with your bank (a chargeback) without
        first contacting us, your account may be suspended pending
        investigation. We strongly prefer to resolve issues directly — it&apos;s
        faster for you and avoids dispute fees on our side.
      </P>

      <H2>8. Changes to this policy</H2>
      <P>
        We may update this policy from time to time. The &quot;Last
        updated&quot; date at the top reflects the most recent revision.
        Changes apply prospectively — purchases made before the change are
        governed by the policy in effect at the time of purchase.
      </P>

      <H2>9. Contact</H2>
      <P>
        For refund-related questions, use the{" "}
        <Link href="/contact" className="text-amber underline-offset-2 hover:underline">
          contact page
        </Link>{" "}
        with the subject &quot;Refund request&quot;. We respond within 2
        business days.
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
    <aside className="rounded-md border border-flag-g-text/30 bg-flag-g-bg px-4 py-3 text-sm leading-relaxed text-flag-g-text">
      {children}
    </aside>
  );
}
