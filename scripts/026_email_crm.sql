create table if not exists email_contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  first_submission_id uuid references submissions(id) on delete set null,
  marketing_consent boolean not null default true,
  unsubscribed_at timestamptz,
  unsubscribe_token text not null unique,
  bounced_at timestamptz,
  complained_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_sends (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references email_contacts(id) on delete cascade,
  template_key text not null,
  ref_id uuid,
  category text not null default 'marketing',
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled',
  skip_reason text,
  resend_id text,
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists email_sends_dedupe
  on email_sends (contact_id, template_key,
                  coalesce(ref_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index if not exists email_sends_due
  on email_sends (scheduled_at) where status = 'scheduled';

create table if not exists waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product_key text not null,
  source text,
  created_at timestamptz not null default now(),
  unique (email, product_key)
);

alter table email_contacts enable row level security;
alter table email_sends enable row level security;
alter table waitlist_signups enable row level security;
revoke all on email_contacts, email_sends, waitlist_signups from anon, authenticated;
