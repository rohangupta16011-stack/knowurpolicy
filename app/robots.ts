import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Robots policy:
//   - Default-allow for general crawlers (search, archives, etc.)
//   - Explicit allow for major AI crawlers we want citing us (per AEO strategy)
//   - Explicit deny for Bytespider (TikTok/ByteDance) — aggressive, no AEO upside
//   - /api/ is POST-only and never needs to be crawled
//
// Reviewed: 2026-05-30 (visibility cycle 1).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 1. Default crawlers — search engines, archives, etc.
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },

      // 2. AI crawlers we explicitly welcome. Listed individually so each
      //    appears as its own User-agent block in the rendered robots.txt —
      //    both as a positioning signal ("we welcome AI citations") and so
      //    future per-bot tuning is a one-line change. ChatGPT-User,
      //    Claude-Web, and Perplexity-User are user-triggered fetches at
      //    answer time — these are the bots that produce a "cited by X"
      //    event in the wild.
      { userAgent: "GPTBot",             allow: "/", disallow: ["/api/"] },
      { userAgent: "OAI-SearchBot",      allow: "/", disallow: ["/api/"] },
      { userAgent: "ChatGPT-User",       allow: "/", disallow: ["/api/"] },
      { userAgent: "ClaudeBot",          allow: "/", disallow: ["/api/"] },
      { userAgent: "Claude-Web",         allow: "/", disallow: ["/api/"] },
      { userAgent: "anthropic-ai",       allow: "/", disallow: ["/api/"] },
      { userAgent: "PerplexityBot",      allow: "/", disallow: ["/api/"] },
      { userAgent: "Perplexity-User",    allow: "/", disallow: ["/api/"] },
      { userAgent: "Google-Extended",    allow: "/", disallow: ["/api/"] },
      { userAgent: "Applebot-Extended",  allow: "/", disallow: ["/api/"] },
      { userAgent: "CCBot",              allow: "/", disallow: ["/api/"] },
      { userAgent: "cohere-ai",          allow: "/", disallow: ["/api/"] },
      { userAgent: "Meta-ExternalAgent", allow: "/", disallow: ["/api/"] },
      { userAgent: "Amazonbot",          allow: "/", disallow: ["/api/"] },

      // 3. Bytespider — TikTok/ByteDance crawler. No AEO upside, history of
      //    aggressive crawl rates. Block site-wide.
      { userAgent: "Bytespider",         disallow: ["/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
