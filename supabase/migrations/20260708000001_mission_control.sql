-- Sprint 1: Mission Control operational dashboard

alter table public.users
  add column if not exists is_admin boolean not null default false;

alter table public.users
  add column if not exists is_disabled boolean not null default false;

alter table public.users
  add column if not exists beta_notes text;

alter table public.users
  add column if not exists daily_ai_budget_usd numeric(8, 4) not null default 5.0;

alter table public.users
  add column if not exists invited_at timestamptz;

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  feature text not null,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  estimated_cost_usd numeric(10, 6) not null default 0,
  response_time_ms integer,
  cached boolean not null default false,
  error boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_created_idx on public.ai_usage_events (created_at desc);
create index if not exists ai_usage_events_user_idx on public.ai_usage_events (user_id, created_at desc);

alter table public.ai_usage_events enable row level security;
-- Service role only for cross-user analytics; no user policies.

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  feedback_type text not null,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  message text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_created_idx on public.user_feedback (created_at desc);

alter table public.user_feedback enable row level security;

create policy user_feedback_insert_own on public.user_feedback
  for insert with check (auth.uid() = user_id or user_id is null);

create policy user_feedback_read_own on public.user_feedback
  for select using (auth.uid() = user_id);

create table if not exists public.error_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  source text not null,
  message text not null,
  stack_trace text,
  metadata jsonb not null default '{}'::jsonb,
  retryable boolean not null default false,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists error_events_created_idx on public.error_events (created_at desc);
create index if not exists error_events_unresolved_idx on public.error_events (resolved, created_at desc);

alter table public.error_events enable row level security;
-- Service role reads for Mission Control.

create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  profession text,
  notes text,
  invited_by uuid references public.users (id) on delete set null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists beta_invites_email_idx on public.beta_invites (email);

alter table public.beta_invites enable row level security;
-- Admin service role only.

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values ('default_daily_ai_budget_usd', '5'::jsonb)
on conflict (key) do nothing;

comment on table public.ai_usage_events is 'OpenAI usage tracking for Mission Control cost analytics.';
