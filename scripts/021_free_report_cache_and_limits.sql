create table if not exists free_report_cache (
  saju_key text primary key,
  facts jsonb not null,            -- the 3 facts, name replaced by {{NAME}}
  context_interpretation text,     -- stage 1 deepAnalysis JSON, name replaced by {{NAME}}
  model_used text,
  created_at timestamptz default now(),
  last_used_at timestamptz default now(),
  use_count integer default 1
);
alter table free_report_cache enable row level security;

create table if not exists free_report_limits (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  day date not null default current_date,
  country text,
  count integer not null default 0,
  updated_at timestamptz default now(),
  unique (ip_hash, day)
);
alter table free_report_limits enable row level security;
create index if not exists idx_free_report_limits_day on free_report_limits(day);

-- Atomic counter: returns the count AFTER this call, or -1 when the caller is already over the limit.
create or replace function bump_free_report_limit(p_ip_hash text, p_country text, p_limit integer)
returns integer
language plpgsql
as $$
declare
  current_count integer;
begin
  insert into free_report_limits (ip_hash, day, country, count)
  values (p_ip_hash, current_date, p_country, 1)
  on conflict (ip_hash, day) do update
    set count = free_report_limits.count + 1,
        country = coalesce(excluded.country, free_report_limits.country),
        updated_at = now()
    where free_report_limits.count < p_limit
  returning count into current_count;

  if current_count is null then
    return -1;
  end if;
  return current_count;
end;
$$;
