-- Milestone 6: Security & Privacy Hardening

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  event_type text not null,
  resource text not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index audit_logs_user_created_idx on public.audit_logs (user_id, created_at desc);
create index audit_logs_event_type_idx on public.audit_logs (event_type, created_at desc);

alter table public.audit_logs enable row level security;

create policy audit_logs_insert_own on public.audit_logs
  for insert with check (auth.uid() = user_id or user_id is null);

create policy audit_logs_read_own on public.audit_logs
  for select using (auth.uid() = user_id);

-- OAuth tokens isolated from user-scoped JWT reads (service role only)
create table public.integration_connection_secrets (
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

alter table public.integration_connection_secrets enable row level security;
-- Intentionally no policies: only service role may read/write secrets.

insert into public.integration_connection_secrets (user_id, provider, access_token, refresh_token, token_expires_at, updated_at)
select user_id, provider, access_token, refresh_token, token_expires_at, updated_at
from public.integration_connections
where access_token is not null
on conflict (user_id, provider) do update
set access_token = excluded.access_token,
    refresh_token = excluded.refresh_token,
    token_expires_at = excluded.token_expires_at,
    updated_at = excluded.updated_at;

update public.integration_connections
set access_token = null,
    refresh_token = null,
    token_expires_at = null,
    updated_at = now()
where access_token is not null or refresh_token is not null;

-- Tighten DNA learning/version tables: append-only for authenticated users
drop policy if exists "Users manage own learning events" on public.executive_dna_learning_events;
drop policy if exists "Users read own learning events" on public.executive_dna_learning_events;
drop policy if exists "Users insert own learning events" on public.executive_dna_learning_events;

create policy executive_dna_learning_events_select on public.executive_dna_learning_events
  for select using (auth.uid() = user_id);

create policy executive_dna_learning_events_insert on public.executive_dna_learning_events
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users read own profile versions" on public.executive_dna_profile_versions;
drop policy if exists "Users insert own profile versions" on public.executive_dna_profile_versions;

create policy executive_dna_profile_versions_select on public.executive_dna_profile_versions
  for select using (auth.uid() = user_id);

create policy executive_dna_profile_versions_insert on public.executive_dna_profile_versions
  for insert with check (auth.uid() = user_id);

comment on table public.audit_logs is 'Security audit trail. Retention: 90 days.';
comment on table public.integration_connection_secrets is 'OAuth secrets. Service role access only.';
