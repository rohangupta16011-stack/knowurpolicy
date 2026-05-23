import Script from "next/script";

// GA4 loader. Renders nothing if NEXT_PUBLIC_GA_ID is unset so dev/preview
// traffic doesn't pollute production metrics.
//
// TODO (per PRD §6.6): gate this behind an explicit-opt-in GDPR consent banner
// before promoting to EU traffic. Right now we set `anonymize_ip` which helps
// but isn't sufficient consent under GDPR strict interpretation.

export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
