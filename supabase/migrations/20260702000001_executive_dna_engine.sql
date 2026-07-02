-- Milestone 3: Executive DNA Engine

create table public.executive_dna_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  overall_confidence numeric(5,2) not null default 0,
  interview_complete boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.executive_dna_field_confidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  field_key text not null,
  confidence numeric(5,2) not null default 0 check (confidence >= 0 and confidence <= 100),
  value jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, field_key)
);

create table public.executive_dna_learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  field_key text not null,
  previous_value jsonb,
  new_value jsonb,
  confidence_before numeric(5,2) not null default 0,
  confidence_after numeric(5,2) not null default 0,
  source text not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create table public.executive_dna_profile_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  version integer not null,
  profile jsonb not null,
  overall_confidence numeric(5,2) not null default 0,
  change_reason text not null default '',
  created_at timestamptz not null default now()
);

create table public.executive_dna_inferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  inference_type text not null,
  payload jsonb not null default '{}'::jsonb,
  confidence numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.executive_dna_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  recommendation text not null,
  category text not null default 'general',
  priority integer not null default 0,
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.executive_dna_interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  overall_confidence numeric(5,2) not null default 0,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index executive_dna_profiles_user_id_idx on public.executive_dna_profiles (user_id);
create index executive_dna_field_confidence_user_id_idx on public.executive_dna_field_confidence (user_id);
create index executive_dna_learning_events_user_id_idx on public.executive_dna_learning_events (user_id);
create index executive_dna_profile_versions_user_id_idx on public.executive_dna_profile_versions (user_id);
create index executive_dna_inferences_user_id_idx on public.executive_dna_inferences (user_id);
create index executive_dna_recommendations_user_id_idx on public.executive_dna_recommendations (user_id);
create index executive_dna_interview_sessions_user_id_idx on public.executive_dna_interview_sessions (user_id);

alter table public.executive_dna_profiles enable row level security;
alter table public.executive_dna_field_confidence enable row level security;
alter table public.executive_dna_learning_events enable row level security;
alter table public.executive_dna_profile_versions enable row level security;
alter table public.executive_dna_inferences enable row level security;
alter table public.executive_dna_recommendations enable row level security;
alter table public.executive_dna_interview_sessions enable row level security;

create policy "Users manage own executive dna profile"
  on public.executive_dna_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own field confidence"
  on public.executive_dna_field_confidence for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users read own learning events"
  on public.executive_dna_learning_events for select
  using (auth.uid() = user_id);

create policy "Users insert own learning events"
  on public.executive_dna_learning_events for insert
  with check (auth.uid() = user_id);

create policy "Users read own profile versions"
  on public.executive_dna_profile_versions for select
  using (auth.uid() = user_id);

create policy "Users insert own profile versions"
  on public.executive_dna_profile_versions for insert
  with check (auth.uid() = user_id);

create policy "Users manage own inferences"
  on public.executive_dna_inferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own recommendations"
  on public.executive_dna_recommendations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own interview sessions"
  on public.executive_dna_interview_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
