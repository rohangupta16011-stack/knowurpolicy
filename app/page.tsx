import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleCheck,
  EyeOff,
  Lock,
  MessageCircle,
  OctagonAlert,
  ShieldCheck,
} from "lucide-react";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { Logo } from "@/components/Logo";
import WaitlistForm from "@/components/WaitlistForm";
import { FAQS, META_DESCRIPTION } from "@/lib/content";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export default function LandingPage() {
  return (
    <>
      <StructuredData />
      <Nav />
      <Hero />
      <Features />
      <SamplePreview />
      <Pricing />
      <FAQ />
      <Footer />
      <LegalDisclaimer />
    </>
  );
}

// JSON-LD per SEO audit §02 — SoftwareApplication for SaaS rich snippets,
// FAQPage for Google answer boxes. Single source of truth for the FAQ
// content (lib/content.ts) so what users see matches what Google indexes.
function StructuredData() {
  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: META_DESCRIPTION,
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "9.99",
        priceCurrency: "USD",
      },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}

function Nav() {
  return (
    <nav className="border-b border-ink-12 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" aria-label="KnowUrPolicy home">
          <Logo size={20} />
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-navy-mid sm:flex">
          <a href="#features" className="hover:text-navy">How it works</a>
          <a href="#pricing" className="hover:text-navy">Pricing</a>
          <a href="#faq" className="hover:text-navy">FAQ</a>
        </div>
        <Link href="/analyze" className="btn-primary !py-1.5 !text-xs">
          Try free
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Subtle ambient glow — kept very tame to preserve editorial calm */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-amber-soft opacity-40 blur-3xl" />

      <div className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center sm:pt-28">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
          AI-powered document clarity
        </div>

        {/* Emphasis on 'before it's too late' (the anxiety trigger),
            not 'act' (the weakest word) — per UX audit P1. */}
        <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] text-navy sm:text-5xl">
          Understand what you&apos;re signing
          <br />
          <em className="not-italic text-amber">before it&apos;s too late.</em>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-navy-mid">
          Upload any policy, contract, lease, terms of service, or legal
          document. Get a plain-English breakdown of what&apos;s included,
          what&apos;s not, and what puts you at risk — in 30 seconds.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/analyze" className="btn-primary text-base">
            Upload your document — it&apos;s free
          </Link>
          <a href="#sample" className="btn-ghost">
            See a sample →
          </a>
        </div>

        <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-navy-mid">
          <Trust icon={<ShieldCheck className="h-3.5 w-3.5 text-flag-g-text" />}>
            Deleted immediately after analysis
          </Trust>
          <Trust icon={<Lock className="h-3.5 w-3.5 text-flag-g-text" />}>
            GDPR compliant
          </Trust>
          <Trust icon={<EyeOff className="h-3.5 w-3.5 text-flag-g-text" />}>
            Never used for AI training
          </Trust>
        </ul>
      </div>
    </section>
  );
}

function Trust({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-1.5 font-medium">
      {icon}
      {children}
    </li>
  );
}

function Features() {
  const items = [
    {
      icon: <CircleCheck className="h-5 w-5" />,
      title: "Clause breakdown",
      desc: "Every clause explained in plain English with a green / yellow / red risk flag.",
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: "Exclusion spotlight",
      desc: "What's NOT covered — the section insurers don't put in the brochure.",
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: "Ask anything",
      desc: "Get direct answers grounded in your specific document. No general knowledge.",
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-10 max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
          How it works
        </div>
        <h2 className="mt-3 font-display text-3xl font-bold text-navy">
          An AI document analyser built for everyday people.
        </h2>
        <p className="mt-3 text-base text-navy-mid">
          Upload any policy, contract, lease, terms-of-service or other legal
          document as a PDF. KnowUrPolicy reads every clause, translates the
          legalese to plain English, and flags what you actually need to read.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-ink-12 bg-white p-6"
          >
            <div className="text-amber">{item.icon}</div>
            <div className="mt-3 text-sm font-semibold text-navy">
              {item.title}
            </div>
            <p className="mt-1 text-sm text-navy-mid">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SamplePreview() {
  return (
    <section id="sample" className="mx-auto max-w-4xl px-6 pb-20">
      <div className="mb-10 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
          Sample analysis
        </div>
        <h2 className="mt-3 font-display text-3xl font-bold text-navy">
          What you get back.
        </h2>
        <p className="mt-2 text-sm text-navy-mid">
          Example below uses a home insurance policy. The same structure works
          for contracts, leases, T&amp;Cs, NDAs — anything you sign.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-ink-12 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-ink-12 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy">
            <span className="text-amber">📄</span>
            home_insurance_2026.pdf
          </div>
          <span className="rounded-full bg-flag-y-bg px-3 py-1 text-xs font-semibold text-flag-y-text">
            Moderate — 54/100
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-lg border border-ink-12 bg-cream p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-amber">
              Plain English summary
            </div>
            <p className="mt-2 text-sm leading-relaxed text-navy">
              A standard homeowners policy covering fire, theft, and weather
              damage to your property, with personal liability up to $100,000.
              Key exclusions include all flood damage and gradual wear and tear.
              You must notify the insurer within 14 days of any incident.
            </p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <ClauseCard
              accent="g"
              tag="Standard"
              title="Fire and smoke damage"
              text="Fully covered for fire, smoke, and explosion damage to the building structure and attached structures."
            />
            <ClauseCard
              accent="r"
              tag="Red flag"
              title="Flood damage excluded"
              text="All flooding — groundwater, storm surge, river overflow — is completely excluded. Separate flood policy required."
            />
            <ClauseCard
              accent="y"
              tag="Watch"
              title="14-day claim notice"
              text="You must report claims within 14 days. Late reporting may reduce or void your payout, even if covered."
            />
            <ClauseCard
              accent="r"
              tag="Red flag"
              title="Vacancy clause"
              text="Coverage suspends if the home is unoccupied for more than 60 consecutive days. Easy to overlook."
            />
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-md bg-amber-soft px-4 py-3 sm:flex-row">
            <p className="text-sm text-navy">
              <strong className="font-semibold">Your turn.</strong> Upload your
              own policy and see what comes back.
            </p>
            <Link
              href="/analyze"
              className="btn-primary !py-2 whitespace-nowrap text-sm"
            >
              Try with your document
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClauseCard({
  accent,
  tag,
  title,
  text,
}: {
  accent: "g" | "y" | "r";
  tag: string;
  title: string;
  text: string;
}) {
  const stripeColor = {
    g: "bg-flag-g-text",
    y: "bg-flag-y-border",
    r: "bg-flag-r-text",
  }[accent];

  const flagClass = { g: "flag-g", y: "flag-y", r: "flag-r" }[accent];

  // Icon reinforces colour for users with colour-vision deficiency — WCAG 1.4.1.
  const FlagIcon = { g: CircleCheck, y: AlertTriangle, r: OctagonAlert }[accent];

  return (
    <div className="group overflow-hidden rounded-lg border border-ink-12 bg-white transition hover:border-ink-22 hover:shadow-sm">
      <div className="flex items-stretch">
        <div className={`w-1 flex-none ${stripeColor}`} />
        <div className="flex-1 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-navy">{title}</span>
            <span className={`flag ${flagClass} text-[10px]`}>
              <FlagIcon className="h-3 w-3" />
              {tag}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-navy-mid">{text}</p>
        </div>
      </div>
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-3xl px-6 pb-20">
      <div className="mb-10 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
          Pricing
        </div>
        <h2 className="mt-3 font-display text-3xl font-bold text-navy">
          Free to try. Pro for unlimited.
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Free */}
        <div className="rounded-lg border border-ink-12 bg-white p-6">
          <div className="font-display text-xl font-bold text-navy">Free</div>
          <div className="mt-2 font-display text-3xl font-bold text-navy">
            $0<span className="ml-1 text-sm font-medium text-navy-mid">forever</span>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-navy">
            <FeatureItem>1 full document analysis</FeatureItem>
            <FeatureItem>3 Q&amp;A follow-up questions</FeatureItem>
            <FeatureItem>All five clause sections</FeatureItem>
          </ul>
          <Link href="/analyze" className="btn-secondary mt-6 w-full">
            Get started
          </Link>
        </div>

        {/* Pro — featured (amber border per design doc) */}
        <div className="relative rounded-lg border-2 border-amber bg-white p-6">
          <span className="absolute -top-2.5 left-6 rounded-full bg-amber px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Most popular
          </span>
          <div className="font-display text-xl font-bold text-navy">Pro</div>
          <div className="mt-2 font-display text-3xl font-bold text-navy">
            $9.99<span className="ml-1 text-sm font-medium text-navy-mid">/month</span>
          </div>
          <ul className="mt-5 space-y-2 text-sm text-navy">
            <FeatureItem>Unlimited document analyses</FeatureItem>
            <FeatureItem>Unlimited Q&amp;A</FeatureItem>
            <FeatureItem>Export analysis as PDF</FeatureItem>
            <FeatureItem>Priority processing</FeatureItem>
          </ul>
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 flex-none text-flag-g-text" />
      <span>{children}</span>
    </li>
  );
}

function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-2xl px-6 pb-24">
      <div className="mb-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
          FAQ
        </div>
        <h2 className="mt-3 font-display text-3xl font-bold text-navy">
          Questions, answered.
        </h2>
      </div>
      <div className="divide-y divide-ink-12 overflow-hidden rounded-lg border border-ink-12 bg-white">
        {FAQS.map((item) => (
          <details key={item.q} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-navy">
              {item.q}
              <span className="ml-4 inline-block text-amber transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-navy-mid">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-12 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-navy-mid sm:flex-row">
        <Logo size={16} />
        <span>© {new Date().getFullYear()} KnowUrPolicy. Built with care.</span>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-navy">Privacy</a>
          <a href="#" className="hover:text-navy">Terms</a>
          <a href="#" className="hover:text-navy">Contact</a>
        </div>
      </div>
    </footer>
  );
}
