-- KnowUrPolicy — operational SQL reference.
--
-- Paste any one of these into Supabase Dashboard → SQL Editor → Run.
-- Each query is self-contained; copy + paste exactly one block.
--
-- Most queries filter out your own test traffic via this list — update it
-- as you add more test emails:
--
--   ('rohan190@gmail.com')                ← canonical (normalized) form
--
-- If a query says "(excluding test emails)" and you want raw numbers
-- including yours, just remove the `where email not in (...)` clause.


-- ============================================================================
-- A. GROWTH & ACTIVATION
-- ============================================================================

-- A1. Headline numbers (all-time, excluding test emails)
select
  count(*)                                              as total_signups,
  count(*) filter (where free_used)                     as activated,
  count(*) filter (where total_analyses > 1)            as paid,
  count(*) filter (where qa_paid_credits > 0
                     or total_qa > 1)                   as qa_paid,
  round(100.0 * count(*) filter (where total_analyses > 1)
        / nullif(count(*) filter (where free_used), 0), 1)
                                                        as conversion_pct
from email_usage
where email not in ('rohan190@gmail.com');


-- A2. New signups per day (last 14 days)
select
  date_trunc('day', first_seen_at)::date as day,
  count(*)                               as new_signups,
  count(*) filter (where free_used)      as activated_same_day
from email_usage
where first_seen_at > now() - interval '14 days'
  and email not in ('rohan190@gmail.com')
group by 1
order by 1 desc;


-- A3. Recent activations (raw rows — useful while volume is small)
select
  email,
  free_used,
  paid_credits,
  total_analyses,
  qa_free_used,
  qa_paid_credits,
  total_qa,
  first_seen_at,
  last_analysis_at
from email_usage
where email not in ('rohan190@gmail.com')
order by first_seen_at desc
limit 50;


-- A4. Power users (most analyses)
select
  email,
  total_analyses,
  paid_credits,
  total_qa,
  last_analysis_at
from email_usage
where total_analyses > 0
  and email not in ('rohan190@gmail.com')
order by total_analyses desc
limit 20;


-- ============================================================================
-- B. REVENUE
-- ============================================================================

-- B1. All-time revenue by currency (captured payments only)
-- Amounts are stored in smallest unit (paise / cents); divide by 100 for
-- human-readable rupees / dollars.
select
  currency,
  count(*)                  as captured_payments,
  sum(amount) / 100.0       as gross_revenue
from payments
where status = 'captured'
  and email not in ('rohan190@gmail.com')
group by currency
order by currency;


-- B2. Revenue by product (analysis vs download vs QA bundle)
select
  product,
  currency,
  count(*)              as orders,
  sum(amount) / 100.0   as gross_revenue
from payments
where status = 'captured'
  and email not in ('rohan190@gmail.com')
group by product, currency
order by product, currency;


-- B3. Revenue by region (which tier is converting?)
select
  region_tier,
  currency,
  count(*)              as orders,
  sum(amount) / 100.0   as gross_revenue
from payments
where status = 'captured'
  and email not in ('rohan190@gmail.com')
group by region_tier, currency
order by region_tier;


-- B4. Daily revenue, last 14 days
select
  date_trunc('day', created_at)::date as day,
  currency,
  count(*)                            as orders,
  sum(amount) / 100.0                 as gross_revenue
from payments
where status = 'captured'
  and created_at > now() - interval '14 days'
  and email not in ('rohan190@gmail.com')
group by 1, 2
order by 1 desc, 2;


-- ============================================================================
-- C. PAYMENT HEALTH
-- ============================================================================

-- C1. Payment status breakdown (last 7 days)
-- Watch the failed:captured ratio. >25% failures suggests a payment-method
-- mix issue (e.g. too many users on cards that don't work internationally).
select
  status,
  count(*)              as count,
  sum(amount) / 100.0   as total_amount
from payments
where created_at > now() - interval '7 days'
  and email not in ('rohan190@gmail.com')
group by status
order by count desc;


-- C2. Recent failed payments (for triage)
select
  email,
  razorpay_order_id,
  amount / 100.0  as amount,
  currency,
  product,
  failure_reason,
  created_at
from payments
where status = 'failed'
  and email not in ('rohan190@gmail.com')
order by created_at desc
limit 20;


-- C3. Orders WITHOUT credit_disbursed_at (idempotency health)
-- These are paid orders where the credit grant didn't fire. Should be 0
-- after the grant_credit_for_order fix. If non-zero, something is broken
-- — webhook URL wrong, RPC errored, etc.
select
  email,
  razorpay_order_id,
  amount / 100.0  as amount,
  currency,
  product,
  status,
  created_at
from payments
where status = 'captured'
  and credit_disbursed_at is null
  and email not in ('rohan190@gmail.com');


-- C4. Average time between payment and credit disbursement (lag check)
-- Should typically be <30s. Long tails suggest webhook delays.
select
  count(*)                                                    as captured_orders,
  round(avg(extract(epoch from credit_disbursed_at - created_at))::numeric, 1)
                                                              as avg_seconds_to_disburse,
  round(max(extract(epoch from credit_disbursed_at - created_at))::numeric, 1)
                                                              as max_seconds_to_disburse
from payments
where status = 'captured'
  and credit_disbursed_at is not null
  and created_at > now() - interval '7 days';


-- ============================================================================
-- D. ENGAGEMENT
-- ============================================================================

-- D1. Funnel: activated -> paid analysis -> paid download -> paid QA
select
  count(*) filter (where free_used)                              as f1_activated,
  count(*) filter (where total_analyses > 1)                     as f2_paid_analysis,
  count(distinct p.email)                                        as f3_paid_download,
  count(*) filter (where qa_paid_credits > 0 or total_qa > 1)    as f4_paid_qa
from email_usage e
left join payments p
  on p.email = e.email
  and p.status = 'captured'
  and p.product = 'download'
where e.email not in ('rohan190@gmail.com');


-- D2. Q&A engagement (who's asking questions?)
select
  email,
  qa_free_used,
  qa_paid_credits,
  total_qa,
  last_qa_at
from email_usage
where total_qa > 0
  and email not in ('rohan190@gmail.com')
order by total_qa desc;


-- D3. Time between signup and first paid action (purchase intent speed)
select
  e.email,
  e.first_seen_at,
  min(p.created_at)                                          as first_paid_at,
  extract(epoch from min(p.created_at) - e.first_seen_at) / 60.0
                                                             as minutes_to_first_paid
from email_usage e
join payments p on p.email = e.email and p.status = 'captured'
where e.email not in ('rohan190@gmail.com')
group by e.email, e.first_seen_at
order by first_paid_at desc
limit 50;


-- ============================================================================
-- E. ABUSE SIGNALS
-- ============================================================================

-- E1. Top IPs by free-attempt count today
-- An IP hitting >3 means the rate limit kicked in. Investigate if you
-- see clusters of failures from the same /24.
select
  ip,
  free_attempts,
  case when free_attempts > 3 then 'blocked' else 'ok' end  as status
from ip_usage_daily
where day = current_date
order by free_attempts desc
limit 20;


-- E2. IPs that hit the rate limit ever
select
  ip,
  day,
  free_attempts
from ip_usage_daily
where free_attempts > 3
order by day desc, free_attempts desc
limit 50;


-- E3. Emails with high analysis counts (suspicious? heavy user?)
-- High volume from one email is fine if they paid. If they paid 1 analysis
-- but ran 10, you have a credit-leak bug.
select
  email,
  total_analyses,
  paid_credits,
  free_used,
  -- total purchases of analysis credit
  (select count(*) from payments
     where payments.email = email_usage.email
       and payments.status = 'captured'
       and payments.product = 'analysis')                   as analysis_purchases
from email_usage
where total_analyses > 3
  and email not in ('rohan190@gmail.com')
order by total_analyses desc;


-- ============================================================================
-- F. WEBHOOK / OPS HEALTH
-- ============================================================================

-- F1. Recent webhook deliveries (volume + types)
select
  event_type,
  count(*)                          as count,
  max(processed_at)                 as last_seen
from webhook_events
where processed_at > now() - interval '7 days'
group by event_type
order by count desc;


-- F2. Duplicate-event protection working? (look for any patterns in event id)
-- The webhook_events table only stores the FIRST receipt per event id, so
-- duplicates from Razorpay are silently ignored. The fact that a payment
-- has 2-3 rows here (authorized, captured, order.paid) for one order is
-- expected and correct.
select
  payload -> 'payload' -> 'payment' -> 'entity' ->> 'order_id'  as order_id,
  count(*)                                                       as events,
  array_agg(event_type order by processed_at)                    as event_sequence,
  min(processed_at)                                              as first_at,
  max(processed_at)                                              as last_at
from webhook_events
where processed_at > now() - interval '7 days'
  and payload -> 'payload' -> 'payment' -> 'entity' ->> 'order_id' is not null
group by 1
order by max(processed_at) desc
limit 20;


-- ============================================================================
-- G. ONE-OFF / MAINTENANCE
-- ============================================================================

-- G1. Reset a specific user's state (e.g. for testing)
-- update email_usage
-- set free_used = false, paid_credits = 0, total_analyses = 0,
--     qa_free_used = false, qa_paid_credits = 0, total_qa = 0
-- where email = 'someone@example.com';


-- G2. Manually grant credit (e.g. for support case)
-- select grant_paid_credits('someone@example.com', 1);
-- select grant_qa_credits('someone@example.com', 5);


-- G3. Mark a payment as refunded (after issuing refund via Razorpay)
-- update payments
-- set status = 'refunded'
-- where razorpay_payment_id = 'pay_xxxxx';
