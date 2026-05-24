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
  last_analysis_at   timestamptz,
  -- Q&A credits: 1 free question per email lifetime, then bundles of N
  -- (currently 5) purchased together for the regional download price.
  qa_free_used       boolean not null default false,
  qa_paid_credits    integer not null default 0 check (qa_paid_credits >= 0),
  total_qa           integer not null default 0 check (total_qa >= 0),
  last_qa_at         timestamptz
);

-- Backfill the QA columns for any pre-existing rows from before this migration.
alter table email_usage add column if not exists qa_free_used boolean not null default false;
alter table email_usage add column if not exists qa_paid_credits integer not null default 0 check (qa_paid_credits >= 0);
alter table email_usage add column if not exists total_qa integer not null default 0 check (total_qa >= 0);
alter table email_usage add column if not exists last_qa_at timestamptz;


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
  product               text not null default 'analysis'
                          check (product in ('analysis', 'download', 'qa')),
  failure_reason        text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Backfill product column for pre-existing rows from before this migration.
alter table payments add column if not exists product text not null default 'analysis'
  check (product in ('analysis', 'download', 'qa'));

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
-- ip_usage_daily — per-IP free-analysis rate limit
-- =============================================================================
-- Backstop to the per-email gate so a single abuser can't spin up unlimited
-- throwaway emails from the same network. Counter resets at midnight UTC
-- (one row per (ip, day) pair). Old rows can be GC'd manually; for an MVP
-- they're cheap enough to leave.
--
-- Counter increments on EVERY free attempt (including ones that get blocked),
-- which is what we want — a blocked abuser shouldn't reset their quota by
-- retrying.

create table if not exists ip_usage_daily (
  ip               text not null,
  day              date not null,
  free_attempts    integer not null default 0 check (free_attempts >= 0),
  first_seen_at    timestamptz not null default now(),
  primary key (ip, day)
);

create index if not exists ip_usage_daily_day_idx on ip_usage_daily (day);


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
-- RPC functions — atomic credit operations
-- =============================================================================
-- Called from the server (with service-role key) from /api/payment/verify and
-- /api/analyze. Atomic so concurrent requests can't double-grant or
-- double-decrement.

-- Grant N paid credits to an email. Upserts if the email is new.
-- Returns the new total credits.
create or replace function grant_paid_credits(
  p_email text,
  p_amount int default 1
)
returns int
language plpgsql
security definer
as $$
declare
  v_new_total int;
begin
  insert into email_usage (email, paid_credits)
  values (p_email, p_amount)
  on conflict (email) do update
    set paid_credits = email_usage.paid_credits + p_amount
  returning email_usage.paid_credits into v_new_total;
  return v_new_total;
end;
$$;

-- Try to consume one analysis credit. Returns:
--   'free'  — free analysis granted (was unused, now marked used)
--   'paid'  — paid credit decremented
--   'none'  — no free, no credits, needs payment
-- Increments total_analyses + sets last_analysis_at on success.
create or replace function consume_analysis_credit(
  p_email text
)
returns text
language plpgsql
security definer
as $$
declare
  v_row email_usage%rowtype;
begin
  -- Ensure row exists with locking for the update
  insert into email_usage (email) values (p_email)
  on conflict (email) do nothing;

  select * into v_row from email_usage where email = p_email for update;

  if not v_row.free_used then
    update email_usage
      set free_used = true,
          total_analyses = total_analyses + 1,
          last_analysis_at = now()
      where email = p_email;
    return 'free';
  elsif v_row.paid_credits > 0 then
    update email_usage
      set paid_credits = paid_credits - 1,
          total_analyses = total_analyses + 1,
          last_analysis_at = now()
      where email = p_email;
    return 'paid';
  else
    return 'none';
  end if;
end;
$$;

-- Increment today's free-attempt counter for an IP and return whether it is
-- still within the limit. Atomic so concurrent uploads from the same IP
-- can't race past the cap.
create or replace function check_and_consume_free_for_ip(
  p_ip text,
  p_max int default 3
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_today date := current_date;
  v_count int;
begin
  insert into ip_usage_daily (ip, day, free_attempts)
  values (p_ip, v_today, 1)
  on conflict (ip, day) do update
    set free_attempts = ip_usage_daily.free_attempts + 1
  returning ip_usage_daily.free_attempts into v_count;
  return v_count <= p_max;
end;
$$;


-- Grant N paid Q&A credits to an email. Upserts if the email is new.
-- Returns the new total qa credits remaining.
create or replace function grant_qa_credits(
  p_email text,
  p_amount int default 5
)
returns int
language plpgsql
security definer
as $$
declare
  v_new_total int;
begin
  insert into email_usage (email, qa_paid_credits)
  values (p_email, p_amount)
  on conflict (email) do update
    set qa_paid_credits = email_usage.qa_paid_credits + p_amount
  returning email_usage.qa_paid_credits into v_new_total;
  return v_new_total;
end;
$$;

-- Try to consume one Q&A credit. Same shape as consume_analysis_credit:
--   'free'  — free question granted (one per email lifetime)
--   'paid'  — paid credit decremented from the bundle
--   'none'  — out of credits, prompt for the next bundle
create or replace function consume_qa_credit(
  p_email text
)
returns text
language plpgsql
security definer
as $$
declare
  v_row email_usage%rowtype;
begin
  insert into email_usage (email) values (p_email)
  on conflict (email) do nothing;

  select * into v_row from email_usage where email = p_email for update;

  if not v_row.qa_free_used then
    update email_usage
      set qa_free_used = true,
          total_qa = total_qa + 1,
          last_qa_at = now()
      where email = p_email;
    return 'free';
  elsif v_row.qa_paid_credits > 0 then
    update email_usage
      set qa_paid_credits = qa_paid_credits - 1,
          total_qa = total_qa + 1,
          last_qa_at = now()
      where email = p_email;
    return 'paid';
  else
    return 'none';
  end if;
end;
$$;


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
alter table ip_usage_daily  enable row level security;
