import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Delivery Policy",
  description:
    "How and when KnowUrPolicy delivers your analysis and PDF download. Digital goods, instant delivery.",
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
  return (
    <LegalPageLayout title="Delivery Policy" lastUpdated="May 24, 2026">
      <Note>
        Short version: KnowUrPolicy sells <strong>digital goods only</strong>.
        There is no physical shipment. Analyses appear in your browser within
        about 30 seconds; PDF downloads start within seconds of payment.
      </Note>

      <H2>1. What we deliver</H2>
      <P>
        KnowUrPolicy delivers two digital products:
      </P>
      <Ul>
        <li>
          <strong>Document analysis</strong> — a plain-English breakdown of
          your uploaded document, returned to your browser as a structured
          on-screen report.
        </li>
        <li>
          <strong>Downloadable PDF</strong> — the analysis formatted as a PDF
          file that you can save, print, or share.
        </li>
      </Ul>
      <P>
        We do not ship any physical goods. There is no postage, no courier,
        and no shipping address required.
      </P>

      <H2>2. When delivery happens</H2>
      <Ul>
        <li>
          <strong>Analysis:</strong> begins immediately after upload (and
          after payment, if your free credit is already used). The full
          analysis is typically returned to your browser within{" "}
          <strong>30 seconds</strong>. Larger or denser documents may take up
          to 90 seconds.
        </li>
        <li>
          <strong>PDF download:</strong> the download link / file is generated
          and triggered in your browser within <strong>~10 seconds</strong> of
          successful payment.
        </li>
      </Ul>

      <H2>3. How delivery happens</H2>
      <P>
        Both products are delivered electronically through your web browser
        on the same session in which you placed the order:
      </P>
      <Ul>
        <li>
          The analysis renders on the <code>/analyze</code> results screen as
          soon as it&apos;s ready.
        </li>
        <li>
          The PDF is generated server-side after payment and downloaded
          directly by your browser (no email attachment, no separate link).
        </li>
      </Ul>
      <P>
        Because delivery happens on the same page, please keep the tab open
        until you see the results / your download has finished.
      </P>

      <H2>4. Delivery locations</H2>
      <P>
        Digital delivery is available <strong>worldwide</strong>, anywhere
        you can reach KnowUrPolicy in a modern browser. Pricing is shown in
        your local currency (Indian Rupees for India, USD for the United
        States, European Union, United Kingdom, and rest of world).
      </P>

      <H2>5. If delivery fails</H2>
      <P>
        On the rare occasion delivery doesn&apos;t complete — analysis times
        out, PDF doesn&apos;t generate, browser crashes mid-download — we
        will either:
      </P>
      <Ul>
        <li>
          Re-deliver the product at no extra charge (if the issue is on our
          side and the analysis can be re-run), or
        </li>
        <li>
          Refund the charge per the{" "}
          <Link
            href="/refunds"
            className="text-amber underline-offset-2 hover:underline"
          >
            Refund &amp; Cancellation Policy
          </Link>
          .
        </li>
      </Ul>
      <P>
        Email us via the{" "}
        <Link href="/contact" className="text-amber underline-offset-2 hover:underline">
          contact page
        </Link>{" "}
        with the subject &quot;Delivery issue&quot; and include the Razorpay
        Payment ID (starts with <code>pay_</code>) so we can locate the
        transaction quickly.
      </P>

      <H2>6. System requirements</H2>
      <P>
        Successful delivery requires:
      </P>
      <Ul>
        <li>A modern browser (Chrome, Safari, Firefox, or Edge — recent versions)</li>
        <li>JavaScript enabled</li>
        <li>An active internet connection for the duration of the analysis</li>
        <li>For PDF downloads: pop-up blocker / download blocker not blocking the page</li>
      </Ul>

      <H2>7. Changes to this policy</H2>
      <P>
        We may update this policy from time to time. The &quot;Last
        updated&quot; date at the top reflects the most recent revision.
      </P>

      <H2>8. Contact</H2>
      <P>
        Questions about delivery? Use the{" "}
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
    <aside className="rounded-md border border-flag-g-text/30 bg-flag-g-bg px-4 py-3 text-sm leading-relaxed text-flag-g-text">
      {children}
    </aside>
  );
}
