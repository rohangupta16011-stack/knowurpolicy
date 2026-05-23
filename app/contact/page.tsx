import type { Metadata } from "next";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with KnowUrPolicy. Bug reports, feature requests, data deletion, partnership enquiries.",
  alternates: { canonical: "/contact" },
};

// Single contact email for now. Swap to a routed form once volume warrants it
// (Resend / Loops / Plain). Mailto is fine for MVP — zero infrastructure,
// works on every device, and lets users use their own mail client.
const CONTACT_EMAIL = "hello@knowurpolicy.com";

export default function ContactPage() {
  return (
    <LegalPageLayout title="Contact" lastUpdated="May 23, 2026">
      <p className="text-lg text-navy-mid">
        We&apos;re a small team. The fastest way to reach us is email — we
        usually reply within a business day.
      </p>

      <div className="mt-6 rounded-lg border border-amber bg-amber-soft p-6">
        <div className="flex items-center gap-3 text-amber">
          <Mail className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.12em]">
            Email us
          </span>
        </div>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-2 block font-display text-2xl font-bold text-navy hover:text-amber"
        >
          {CONTACT_EMAIL}
        </a>
      </div>

      <h2 className="mt-12 font-display text-2xl font-bold text-navy">
        What to write about
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ContactCard
          icon={<MessageCircle className="h-4 w-4" />}
          title="Product feedback"
          body="Bug reports, feature requests, document types we don't yet handle well, or anything that didn't go the way you expected."
        />
        <ContactCard
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Privacy & data requests"
          body="Access, deletion, rectification, portability, or any GDPR / CCPA request. Subject line: 'Data request'. We respond within 30 days."
        />
        <ContactCard
          icon={<Mail className="h-4 w-4" />}
          title="Press & partnerships"
          body="Media enquiries, integration partnerships, white-label questions, or anything commercial. Subject line: 'Partnership'."
        />
        <ContactCard
          icon={<MessageCircle className="h-4 w-4" />}
          title="Legal & abuse"
          body="DMCA, abuse reports, legal notices. Subject line: 'Legal'. For urgent legal matters, mark the email accordingly."
        />
      </div>

      <h2 className="mt-12 font-display text-2xl font-bold text-navy">
        Quick answers
      </h2>
      <p>
        For common questions about what the product does, what documents
        work, and whether it&apos;s legal advice, the{" "}
        <a href="/#faq" className="text-amber underline-offset-2 hover:underline">
          FAQ on the homepage
        </a>{" "}
        is the fastest path. The{" "}
        <a href="/privacy" className="text-amber underline-offset-2 hover:underline">
          Privacy Policy
        </a>{" "}
        covers how we handle your data.
      </p>
    </LegalPageLayout>
  );
}

function ContactCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-ink-12 bg-white p-5">
      <div className="flex items-center gap-2 text-amber">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-[0.08em]">
          {title}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-navy-mid">{body}</p>
    </div>
  );
}
