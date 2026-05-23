import { ImageResponse } from "next/og";

// Generates /opengraph-image at build time. Branded 1200x630 social card —
// replaces the GoDaddy stock-photo og:image the SEO audit flagged.

export const runtime = "edge";
export const alt = "KnowUrPolicy — Understand before you sign.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#FAF8F5",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top: logomark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg
            viewBox="0 0 36 44"
            width="56"
            height="68"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 0 H24 L36 12 V44 H2 Z" fill="#0A2540" />
            <path d="M24 0 L36 12 H24 Z" fill="#15406B" />
            <rect x="8" y="18" width="20" height="2" rx="1" fill="#FAF8F5" opacity="0.85" />
            <rect x="8" y="24" width="20" height="2" rx="1" fill="#FAF8F5" opacity="0.85" />
            <rect x="8" y="30" width="14" height="2" rx="1" fill="#C96A00" />
          </svg>
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#0A2540",
              letterSpacing: -1,
              display: "flex",
            }}
          >
            Know<span style={{ color: "#C96A00" }}>Ur</span>Policy
          </div>
        </div>

        {/* Middle: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#0A2540",
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Understand your policy
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#C96A00",
              fontStyle: "italic",
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            before it&apos;s too late.
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#15406B",
              marginTop: 16,
              fontFamily: "Helvetica, sans-serif",
            }}
          >
            AI policy + contract analysis. Plain English in 30 seconds.
          </div>
        </div>

        {/* Bottom: chips */}
        <div
          style={{
            display: "flex",
            gap: 12,
            fontFamily: "Helvetica, sans-serif",
          }}
        >
          {[
            { bg: "#E8F7EF", fg: "#0A6640", label: "✓ Private" },
            { bg: "#FEF3E2", fg: "#C96A00", label: "Not legal advice" },
            { bg: "#FEF3E2", fg: "#C96A00", label: "GDPR compliant" },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: c.bg,
                color: c.fg,
                padding: "10px 20px",
                borderRadius: 999,
                fontSize: 22,
                fontWeight: 600,
                display: "flex",
              }}
            >
              {c.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
