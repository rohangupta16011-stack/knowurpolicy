# Search & AI Visibility Agent Team

This project is an agentic SEO + AEO/GEO operation. The **main Claude Code session is the
orchestrator**. It plans the work, delegates focused jobs to the subagents in `.claude/agents/`,
and assembles the results. Each subagent runs in its own isolated context and returns only a
summary — keep the main thread clean.

## Properties I optimize

| Property | What it is | Surfaces that matter | Primary geo |
|---|---|---|---|
| **Fintech Teacher** | Fintech + PM education (site + YouTube) | Google, YouTube search, AI Overviews, ChatGPT/Perplexity | India + global |
| **AI.PM** | LinkedIn brand on AI product management | LinkedIn search, Google, LLM citations for "AI PM" queries | Global |
| **KnowUrPolicy** | AI legal-document analysis tool | Google, AI Overviews, ChatGPT/Perplexity/Gemini buying queries | India primary, US/UK/EU secondary |

## Operating rules (apply to ALL agents)

1. **Two surfaces, always.** Every recommendation must consider both classic Google ranking AND
   citability by answer engines (ChatGPT, Perplexity, Gemini, Claude, Google AI Overviews).
2. **Citability format.** Favor clear definitions, Q&A blocks, named entities, stats with sources,
   and scannable structure. LLMs quote what is easy to extract and attribute.
3. **Authority over volume.** No mass autopublishing. Google penalizes scaled unreviewed AI content,
   and LLMs cite trusted sources. Agents draft and QA; a human approves before publish.
4. **Entities, not just keywords.** Tie content to clear entities (FairMoney, UPI, "AI product
   manager", "insurance policy analysis") so models understand what the page is *about*.
5. **Evidence trail.** Every claim about rankings, citations, or fixes must link to data
   (Search Console, a crawl, or a logged LLM query). No vibes.

## The weekly cycle (orchestrator runbook)

1. `aeo-visibility` → where do I rank / get cited now? Output a gap list.
2. `seo-research` → mine keywords + the real prompts people ask LLMs in these niches.
3. `content-strategist` → turn top gaps into briefs in `/briefs`.
4. `writer` → draft from briefs (citable structure).
5. `technical-schema` → schema + crawlability for new/edited pages.
6. `audit` → grade everything against the SEO + GEO scorecard; output `/reports`.
7. Orchestrator → summarize, prioritize next week's backlog.

Invoke a subagent by name, e.g. *"Use the aeo-visibility agent to check KnowUrPolicy citations."*
Run `/agents` to list them.
