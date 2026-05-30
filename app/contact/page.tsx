import type { Metadata } from "next";
import { MessageCircle, ShieldCheck, CreditCard, Briefcase } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import LegalPageLayout from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with KnowUrPolicy. Bug reports, feature requests, data deletion, partnership enquiries.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalPageLayout
      title="Contact"
      lastUpdated="May 24, 2026"
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact" },
      ]}
    >
      <p className="text-lg text-navy-mid">
        Fill in the form and we&apos;ll get back to you at the email you
        provide. We aim to reply within <strong>2 business days</strong>.
      </p>

      <div className="mt-8 rounded-lg border border-ink-12 bg-white p-6 sm:p-8">
        <ContactForm />
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
          body="Access, deletion, rectification, portability, or any GDPR / CCPA / DPDP request. Pick &quot;Privacy / data request&quot; in the form. We respond within 30 days."
        />
        <ContactCard
          icon={<CreditCard className="h-4 w-4" />}
          title="Billing & refunds"
          body="Payment issues, refund requests, or anything related to your purchase. Include your Razorpay Payment ID if you have it."
        />
        <ContactCard
          icon={<Briefcase className="h-4 w-4" />}
          title="Press & partnerships"
          body="Media enquiries, integration partnerships, white-label questions, or anything commercial."
        />
      </div>

      <h2 className="mt-12 font-display text-2xl font-bold text-navy">
        Quick answers
      </h2>
      <p>
        For common questions about what the product does, what documents work,
        and whether it&apos;s legal advice, the{" "}
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
