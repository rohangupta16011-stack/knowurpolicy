import Footer from "@/components/Footer";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import Nav from "@/components/Nav";

// Shared chrome for static legal/info pages. Keeps /privacy, /terms, /contact
// visually consistent with the landing page without re-implementing nav.
//
// Tailwind's prose plugin isn't installed, so we apply explicit utilities
// directly to elements via a max-width prose-ish container.
export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 pb-32 pt-12">
        <header className="mb-10 border-b border-ink-12 pb-6">
          <h1 className="font-display text-4xl font-bold leading-tight text-navy">
            {title}
          </h1>
          {lastUpdated && (
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-navy-mid">
              Last updated: {lastUpdated}
            </p>
          )}
        </header>
        <article className="space-y-6 text-base leading-relaxed text-navy">
          {children}
        </article>
      </main>
      <Footer />
      <LegalDisclaimer />
    </>
  );
}
