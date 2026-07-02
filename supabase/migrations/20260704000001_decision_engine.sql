-- Milestone 5: Decision Engine

create table public.decision_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  external_key text not null,
  title text not null,
  action_label text not null,
  source text not null,
  source_ref text,
  impact numeric(5,2) not null default 0,
  urgency numeric(5,2) not null default 0,
  risk numeric(5,2) not null default 0,
  confidence numeric(5,2) not null default 0,
  dependencies numeric(5,2) not null default 0,
  estimated_time numeric(5,2) not null default 0,
  energy_required numeric(5,2) not null default 0,
  financial_effect numeric(5,2) not null default 0,
  strategic_importance numeric(5,2) not null default 0,
  score numeric(5,2) not null default 0,
  explanation text not null default '',
  because jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  queued_for date not null default (current_date),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, external_key, queued_for)
);

create table public.decision_learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  decision_id uuid references public.decision_items (id) on delete set null,
  external_key text,
  event_type text not null,
  source text,
  score_before numeric(5,2),
  weight_adjustments jsonb not null default '{}'::jsonb,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create table public.decision_weight_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  weights jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index decision_items_user_queue_idx on public.decision_items (user_id, queued_for, score desc);
create index decision_items_user_status_idx on public.decision_items (user_id, status);
create index decision_learning_events_user_idx on public.decision_learning_events (user_id, created_at desc);

alter table public.decision_items enable row level security;
alter table public.decision_learning_events enable row level security;
alter table public.decision_weight_profiles enable row level security;

create policy decision_items_user_policy on public.decision_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy decision_learning_events_user_policy on public.decision_learning_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy decision_weight_profiles_user_policy on public.decision_weight_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
