-- 020: payments hardening (99 Facts / PayPal)
-- Run this in the Supabase SQL editor BEFORE deploying the matching code.

alter table payments drop constraint if exists payments_status_check;
alter table payments add constraint payments_status_check
  check (status in ('pending','completed','failed','refunded','duplicate_paid'));

alter table payments add column if not exists paypal_capture_id text;
alter table payments add column if not exists confirmation_email_sent_at timestamptz;
alter table payments add column if not exists reconciled_at timestamptz;

create table if not exists paypal_webhook_events (
  event_id text primary key,
  event_type text,
  received_at timestamptz default now()
);
alter table paypal_webhook_events enable row level security;

create index if not exists idx_payments_pending on payments(created_at) where status = 'pending';

-- ---------------------------------------------------------------------------
-- Manual review (do NOT run automatically): submissions with more than one
-- completed payment, i.e. buyers who paid twice.
--
-- select submission_id,
--        count(*)                       as completed_count,
--        array_agg(paypal_order_id order by completed_at) as order_ids,
--        array_agg(completed_at order by completed_at)    as completed_at_list
-- from payments
-- where status = 'completed'
-- group by submission_id
-- having count(*) > 1
-- order by completed_count desc;
-- ---------------------------------------------------------------------------
