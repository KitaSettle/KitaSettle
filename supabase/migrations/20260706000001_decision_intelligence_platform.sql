-- Milestone 5: Decision Intelligence Platform enhancements

alter table public.decision_items
  add column if not exists learning_value numeric(5,2) not null default 0;

alter table public.decision_items
  add column if not exists explanation_detail jsonb not null default '{}'::jsonb;

create table if not exists public.decision_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  decision_id uuid references public.decision_items (id) on delete set null,
  title text not null,
  action_label text not null,
  why_made text not null default '',
  outcome text,
  event_type text not null default 'queued',
  score numeric(5,2) not null default 0,
  confidence numeric(5,2) not null default 0,
  source text,
  recorded_at timestamptz not null default now()
);

create index if not exists decision_timeline_user_idx
  on public.decision_timeline_entries (user_id, recorded_at desc);

alter table public.decision_timeline_entries enable row level security;

create policy decision_timeline_user_policy on public.decision_timeline_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.decision_timeline_entries is 'Append-only executive decision timeline. Never overwrite history.';
