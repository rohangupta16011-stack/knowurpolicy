# KnowUrPolicy — Growth Plan

Living document. Edit as reality changes. Updated 2026-05-26.

---

## Where you are right now

- Product is live at https://knowurpolicy.com
- ~5 activated users, mostly your own test traffic
- ~₹0 real revenue (all live charges so far were tests)
- Solo founder, no marketing budget allocated
- Razorpay live mode active for India + International
- Full stack: free + paid analysis, paid PDF, paid Q&A bundle, region-aware pricing

**The bottleneck is distribution, not product.** Don't add features for the
next 90 days unless paying users explicitly ask for them.

---

## The North Star metric: weekly *activated* users

Track this every Sunday. Goal trajectory:

| Week | Activated users (cumulative) |
|------|------------------------------|
| Now  | ~5 (mostly you)              |
| +30d | 50 real users                |
| +60d | 200                          |
| +90d | 500                          |

Everything else (revenue, conversion, retention) is downstream. If activated
isn't growing, no other metric will.

Query to run every Sunday (excludes your test emails):

```sql
select date_trunc('week', first_seen_at)::date as week,
       count(*)                                  as new_activated
from email_usage
where free_used
  and email not in ('rohan190@gmail.com')
group by 1 order by 1 desc;
```

---

## Pick ONE wedge — don't market "any document"

Your product *can* read anything. Your marketing must promise one specific thing.

### Recommended wedge: **Rental agreements in Indian metros**

| Why | Detail |
|-----|--------|
| **Acute pain** | Renter has ₹50,000–₹2,00,000 deposit at risk. ₹99 to de-risk is a no-brainer trade. |
| **High volume** | Millions of fresh rental agreements signed every year in Bangalore / Mumbai / Pune / Hyderabad / NCR. |
| **Distribution exists** | Active subreddits (r/bangalore, r/mumbai, r/india_real_estate), Twitter, Telegram broker groups, NoBroker / MagicBricks forums. |
| **Clear language win** | Hindi-English landlord clauses are notoriously hostile. The "translate this jargon" value is obvious. |
| **Repeat-customer-ish** | People move every 11 months in metros. Email captured → next renewal is 11 months away → you have inbox real estate. |

### Backup wedge to test in parallel: **Job offer letters & NDAs**

Faster decision cycle (signing within days), tech-worker audience that's
already English-comfortable and online. Smaller TAM than rentals, but
better intent-to-pay ratio. Distribute via Blind, LinkedIn, tech Twitter.

### Wedges NOT to chase yet
- General "any contract" — too vague, no clear search intent
- Insurance policies — slow buying cycle, customer waits years between purchases
- Freelancer contracts — small audience, will get there for free via Twitter
- B2B / legal teams — different sales motion, requires you to do enterprise

**Action by end of week 1:** add a `/lease` landing page that says
"KnowUrPolicy for rental agreements" with 3 example clauses analysed
(redacted real PDF). Same backend, different framing. Use it in DMs.

---

## Channel ladder (in order of leverage)

### 1. Cold DMs in Reddit comments + Twitter mentions (free, week 1)
Highest-leverage move when activated < 50. You're trading time for users
1-on-1, which doesn't scale — but you learn what makes them say yes.

**Where to look every day for 30 days:**
- r/bangalore / r/mumbai / r/pune / r/delhi / r/india / r/india_real_estate
- Search: "rental agreement", "landlord", "deposit", "lease", "11 months"
- Twitter advanced search: same terms, last 7 days, India-located

**The DM template (rentals):**

> Hey — saw your post about [specific thing they said]. I built a tool that
> reads rental agreements and pulls out the unfair clauses + deposit traps
> in plain English. Takes 30 seconds. Want me to run yours? Free, no
> account needed for the first one. knowurpolicy.com

Personalise the first sentence every time. Hit send 5x per day, 5 days a
week = 100 personal DMs / month. Expect 20% response, 5% activation = ~5
real users from this channel alone, probably more once you have testimonials.

**Track in a simple Google Sheet**: date, channel, link, response Y/N,
activated Y/N, notes. After 30 DMs you'll know what hook works.

### 2. Build-in-public Twitter (free, week 1 onwards)
3 tweets / week. Mix:
- Behind-the-scenes: "Just shipped Razorpay live mode. Here's what fired 3x for one payment — and how I fixed it."
- Specific value: "I ran a Bangalore PG agreement through my tool. Here are 3 deposit clauses landlords always hide."
- Public asks: "Looking for 10 renters in Bangalore to free-test KnowUrPolicy. DM me."

Tag `@indiestartups`, `@buildspace`, `@_paaglu_` etc. on threads about
problems your tool solves. Founders with audiences amplify other founders.

Stop the "tweet about my tool" cycle if you haven't crossed 100 followers
in 60 days — your content isn't resonating, switch to commenting on
existing big accounts instead.

### 3. SEO long-tail content (slow burn, week 4 onwards)
Pick 1 article / week. Each targets a specific long-tail query:
- "What is a lock-in period in Indian rental agreements?"
- "Standard security deposit clauses to look for in Bangalore leases"
- "Notice period in rental agreements — what's normal vs predatory?"
- "Indian rental agreement red flags 2026"
- "PG agreement vs rental agreement: what's the difference?"

Each article is ~1500 words, ends with "Run your own analysis →
knowurpolicy.com/lease". Internal-link the articles to each other. Set
canonical URL. Use the existing JSON-LD setup as a template.

These take 3–6 months to rank but compound forever. By month 6 you should
own a handful of long-tail queries that send 10–30 visits / day each.

### 4. Product Hunt launch (one shot, month 2 or 3)
Wait until:
- You have 10 real testimonials on the homepage
- You have 100+ activated users (so the launch metrics look good)
- A launch tweet thread is pre-written

Then launch on a Wednesday. Aim for top 5 of the day. Expect a one-time
spike of 500–2000 visits, ~50–200 new activations, and credibility you
can name-drop forever ("featured on Product Hunt").

### 5. Indian community lurks (low effort, high signal)
- Indie Hackers — post a milestones thread when you cross ₹10k MRR
- IndianStartups — share learnings, not promos
- Y Combinator / 0to1 / Foundercrate communities — answer questions
- Maharaj-Founders, Antler / Z Fellows / On Deck if you applied — say it

The goal here is **discovery, not direct conversion**. People remember
the name. When their lease renewal comes up 6 months later, they
remember "that AI policy thing".

### 6. Things to defer
- Paid ads (Google, Meta, Twitter) — CAC unknown. Burn money for
  experience, not for revenue. Defer until you have 200+ activated users
  and know which segment converts.
- Influencer / creator partnerships — same reason.
- B2B / enterprise / law-firm pitches — different sales motion.
- SEO content beyond long-tail (e.g. competing on "AI contract analysis"
  head term) — wasted effort, will get drowned out by VC-funded competitors.

---

## Pricing levers worth testing

Don't touch prices for 90 days. After that, the cheap-to-test variants:

| Test | Hypothesis |
|------|-----------|
| 5-pack analysis bundle at ₹399 instead of ₹99 × 5 | Some users have multiple docs (renter + employment); a small bundle discount drives larger transactions |
| Lock-in deals: ₹999 / year unlimited for power users | Long-tail price discovery; might convert lawyers / brokers |
| Region tier 3 down to $0.99 from $1.49 | Africa / Latin America / SEA volume |

Test one at a time. Run for 30 days each. Roll back if revenue/user drops
more than 10%.

---

## Conversion levers (when activated crosses 100)

You currently have **no idea** where users drop off. To find out:

1. Add GA4 funnel events (you have GA wired up) for:
   - `analyze_started` (file picked)
   - `analyze_completed` (results shown)
   - `download_clicked` (free-tier paywall)
   - `download_paid` (success)
   - `qa_opened`
   - `qa_paid`
2. Look at funnel after 2 weeks of data.
3. Fix the worst step first.

Typical wins to try once you can see the funnel:
- Faster analysis time (currently 30–45s; if Vercel Pro unblocks 300s
  timeout, you can also bump the per-section item cap from 8 back to
  unlimited)
- Bigger / louder Download CTA on the preview view
- "Trusted by N renters in Bangalore" social proof above the upload box

---

## Roadmap of milestones, not features

| Milestone | Target | Done? |
|-----------|--------|-------|
| First real (non-test) activated user | Week 1 | |
| 10 real activated users | Week 2 | |
| First real ₹99 paying user | Week 2-3 | |
| 5 written testimonials on homepage | Week 4 | |
| 50 real activated users | Week 4 | |
| First piece of SEO content live | Week 4 | |
| ₹5,000 real revenue in a single week | Week 8 | |
| 200 real activated users | Week 8 | |
| Product Hunt launch | Week 10–12 | |
| ₹25,000 / month run-rate | Week 12 | |
| 500 activated users | Week 12 | |

If a milestone slips by >2 weeks, write down honestly *why*. Pattern-match
across slipped milestones — that's usually where your real bottleneck is
(positioning, channel mismatch, product quality, time available).

---

## Testimonial-collection playbook

Every free-tier user who completed analysis → email them 24h later:

> Hi [name] — I noticed you ran [doc name] through KnowUrPolicy yesterday.
> Did the analysis catch anything you didn't already know? I'm collecting
> short testimonials to help other people decide whether to try it — would
> you be open to sharing one sentence I can put on the site (with your
> first name + city)? No worries either way.

Expect 30–50% reply rate while you're small. Each "yes" → put on
homepage. By 20 testimonials, you have proof. Don't fabricate.

---

## Weekly cadence

Set a 30-minute calendar slot every **Sunday evening**:
1. Run the 3 SQL queries from `supabase/queries.sql` sections A and B.
2. Update the "Where you are right now" section at the top of this file.
3. Update the milestone table.
4. Write one sentence: "what worked this week, what didn't, what to try
   next."

Compounds. After 12 weeks you have a journal that's worth gold.

---

## What success at +90 days looks like

- 500 activated users (~10 / day inbound, half organic)
- ~50 paying customers
- ₹25,000–₹50,000 monthly revenue
- 1 SEO page ranking in top 10 for a long-tail rental query
- 10+ testimonials live
- One viral tweet thread (>500 likes)
- A clear answer to "what's the single channel pulling most of my growth"

If you have those, you know where to invest the next quarter (probably
in that single channel, harder).

If you don't have those at +90 days, the wedge or the positioning is
wrong. Switch wedges (try offer letters) before assuming the product
or the price is wrong.

---

## Anti-goals — the things that look like progress but aren't

- Adding new document types beyond the wedge
- Building a CRM, an admin dashboard, a subscription tier
- Networking events / meetups (low ROI for early SaaS)
- "Branding" — logo iterations, colour palette swaps
- Cold email blasts via tools like Apollo (mostly lands in spam)
- Hiring (you can't afford it and you don't yet know what to delegate)

If you find yourself doing any of these, redirect to the channel ladder.
