import Footer from "@/components/Footer";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import Nav from "@/components/Nav";
import { SITE_URL } from "@/lib/site";

type BreadcrumbItem = { name: string; path: string };

// Shared chrome for static legal/info pages. Keeps /privacy, /terms, /contact
// visually consistent with the landing page without re-implementing nav.
//
// Tailwind's prose plugin isn't installed, so we apply explicit utilities
// directly to elements via a max-width prose-ish container.
export default function LegalPageLayout({
  title,
  lastUpdated,
  breadcrumb,
  children,
}: {
  title: string;
  lastUpdated?: string;
  /** Optional breadcrumb trail; emits BreadcrumbList JSON-LD when set.
   *  First item is typically "Home" pointing at "/". Last item should be
   *  the current page. Paths are relative to SITE_URL. */
  breadcrumb?: BreadcrumbItem[];
  children: React.ReactNode;
}) {
  const breadcrumbSchema =
    breadcrumb && breadcrumb.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumb.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: `${SITE_URL}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
          })),
        }
      : null;

  return (
    <>
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
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
