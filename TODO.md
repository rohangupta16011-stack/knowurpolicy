# KnowUrPolicy — open items

Internal-only. Not shipped to users. Update as items land or fall off.

## Legal — needs attorney review before scale

These pages are honest, plain-English drafts written by the founder + AI.
They are **binding** as published, but should be reviewed by a qualified
attorney before:

- material expansion of data collection beyond what's described in `/privacy`
- launching in a new regulated market (EU GDPR enforcement, UK, US state
  privacy laws beyond CCPA)
- monthly payment volume crosses ~₹5L / USD 6,000 (point at which a real
  dispute starts costing more than a lawyer's review)

Pages to review:

- [ ] `/privacy` — data practices, processor list, retention, international transfers
- [ ] `/terms` — limitation of liability cap, governing law (Bengaluru / India),
      dispute resolution clause
- [ ] `/refunds` — 7-day window, refund eligibility criteria, chargeback policy
- [ ] `/delivery` — digital-goods delivery terms (lower risk, but worth a glance)

What to ask the attorney to focus on:

1. **Liability cap** in Terms §10 — is "greater of (a) 12-month spend or
   (b) ₹4,000 / USD 50" defensible under Indian Consumer Protection Act 2019?
2. **Refund policy** — are the explicit exclusions in Refunds §4 enforceable,
   or do they conflict with consumer protection rules?
3. **DPDP Act compliance** — does the data-handling description in Privacy §3
   and §8 satisfy the consent + processor-disclosure requirements?
4. **Cross-border transfer language** in Privacy §9 — is the SCC / EU-US DPF
   reference sufficient for EU users, given we're an Indian merchant?
5. **Dispute resolution** in Terms §13 — should we add an arbitration clause
   before scaling, or is exclusive Bengaluru jurisdiction enough?

## Other open items

- [ ] Wire `/api/waitlist` to actually persist to Supabase `waitlist` table
      (currently logs only — see `app/api/waitlist/route.ts`)
- [ ] Add a sign-out link / account chip in the Nav once Google sign-in
      is in active use
- [ ] Apply for IEC (Import Export Code) at iec.dgft.gov.in once
      international payment volume picks up — needed once aggregate
      international receipts cross ~USD 10,000/year
- [ ] Replace draft business address in any Razorpay KYC submission with
      the registered business address once incorporation is finalized
