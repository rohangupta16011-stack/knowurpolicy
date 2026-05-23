-- KnowUrPolicy — Supabase schema v1
--
-- Paste this into Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent: safe to re-run; uses IF NOT EXISTS / CREATE OR REPLACE
-- everywhere.
--
-- Tables:
--   email_usage     — freemium gate per PRD §6.5 (1 free per email, paid after)
--   payments        — Razorpay order/payment records (audit + reconciliation)
--   webhook_events  — Razorpay webhook idempotency (dedupe duplicate deliveries)
--   waitlist        — pricing-page "notify me when paid plans launch" captures
--
-- All tables have Row Level Security ENABLED with no policies — meaning the
-- anon key cannot read or write anything. Only the server (using the
-- SERVICE_ROLE_KEY, which bypasses RLS) can touch these tables. This is the
-- safe default for backend-only data.


-- =============================================================================
-- Extensions
-- =============================================================================

create extension if not exists "pgcrypto";


-- =============================================================================
-- email_usage — freemium gate
-- =============================================================================
-- One row per unique email address. Tracks whether the free analysis has been
-- consumed and how many paid analyses remain.
--
-- When a user uploads:
--   1. Look up email_usage by email
--   2. If row doesn't exist → free analysis, insert with free_used=true
--   3. If free_used=false → free analysis, mark free_used=true
--   4. If free_used=true and paid_credits > 0 → paid analysis, decrement
--   5. If free_used=true and paid_credits = 0 → block + prompt for payment

create table if not exists email_usage (
  email              text primary key,
  free_used          boolean not null default false,
  paid_credits       integer not null default 0 check (paid_credits >= 0),
  total_analyses     integer not null default 0 check (total_analyses >= 0),
  first_seen_at      timestamptz not null default now(),
  last_analysis_at   timestamptz
);


-- =============================================================================
-- payments — Razorpay order + payment records
-- =============================================================================
-- One row per Razorpay order created. Updated when payment captures or fails.
-- Amounts stored in the smallest currency unit:
--   INR: paise   (e.g. ₹99   → 9900)
--   USD: cents   (e.g. $2.99 → 299)
-- This matches what Razorpay expects on the API.

create table if not exists payments (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null,
  razorpay_order_id     text unique not null,
  razorpay_payment_id   text unique,
  amount                integer not null check (amount > 0),
  currency              text not null check (currency in ('INR', 'USD')),
  status                text not null default 'created'
                          check (status in ('created', 'captured', 'failed', 'refunded')),
  credits_granted       integer not null default 1 check (credits_granted >= 0),
  region_tier           text not null check (region_tier in ('tier1', 'tier2', 'tier3')),
  failure_reason        text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists payments_email_idx       on payments (email);
create index if not exists payments_status_idx      on payments (status);
create index if not exists payments_created_at_idx  on payments (created_at desc);


-- =============================================================================
-- webhook_events — Razorpay webhook idempotency
-- =============================================================================
-- Razorpay can deliver the same webhook multiple times (network retries, etc).
-- Every event has a unique id; we record it on first receipt and ignore
-- duplicates. Prevents double-granting credits if the webhook fires twice.

create table if not exists webhook_events (
  id            text primary key,
  event_type    text not null,
  payload       jsonb not null,
  processed_at  timestamptz not null default now()
);

create index if not exists webhook_events_event_type_idx on webhook_events (event_type);


-- =============================================================================
-- waitlist — pricing-page "notify me" captures
-- =============================================================================
-- Currently captured by /api/waitlist but only logged. Once this table exists
-- we'll wire the endpoint to persist here.

create table if not exists waitlist (
  email      text primary key,
  joined_at  timestamptz not null default now(),
  source     text not null default 'pricing'
);


-- =============================================================================
-- Triggers — auto-update `updated_at` on payments
-- =============================================================================

create or replace function trigger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on payments;
create trigger set_updated_at
  before update on payments
  for each row
  execute function trigger_set_updated_at();


-- =============================================================================
-- Row Level Security — deny by default
-- =============================================================================
-- No policies means anon-key requests get zero rows. Server uses service-role
-- key which bypasses RLS entirely. This is intentional — these tables are
-- backend-only.

alter table email_usage     enable row level security;
alter table payments        enable row level security;
alter table webhook_events  enable row level security;
alter table waitlist        enable row level security;
