import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Plus Jakarta Sans (body) is the default `font-sans`.
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Playfair Display (display) for headings, brand, hero copy.
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        // Brand
        navy: {
          DEFAULT: "#0A2540",
          mid: "#15406B",
          light: "#1E5490",
        },
        amber: {
          DEFAULT: "#C96A00",
          hover: "#E07B00",
          soft: "#FEF3E2",
        },
        cream: "#FAF8F5",
        // Risk flags — text + bg + border per design doc §02
        flag: {
          "g-text": "#0A6640",
          "g-bg": "#E8F7EF",
          "y-text": "#7A5500",
          "y-bg": "#FFF8DC",
          "y-border": "#B07800",
          "r-text": "#A01515",
          "r-bg": "#FEF0F0",
        },
        // Translucent ink against the cream canvas — usable for border, bg, text
        "ink-12": "rgba(10, 37, 64, 0.12)",
        "ink-22": "rgba(10, 37, 64, 0.22)",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
      },
      fontSize: {
        // Design doc scale — exact pixel values
        xs: ["11px", { lineHeight: "1.5", letterSpacing: "0.03em" }],
        sm: ["13px", { lineHeight: "1.5" }],
        base: ["15px", { lineHeight: "1.65" }],
        lg: ["18px", { lineHeight: "1.4" }],
        xl: ["20px", { lineHeight: "1.3" }],
        "2xl": ["26px", { lineHeight: "1.2" }],
        "3xl": ["36px", { lineHeight: "1.15" }],
        "4xl": ["48px", { lineHeight: "1.1" }],
        "5xl": ["64px", { lineHeight: "1.05" }],
      },
    },
  },
  plugins: [],
};

export default config;
