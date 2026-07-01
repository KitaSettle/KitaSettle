-- KitaSettle Sprint 7: Core schema

create extension if not exists "pgcrypto";

-- Profiles linked to Supabase Auth
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  summary text not null,
  content text not null default '',
  source text not null,
  url text not null default '',
  category text not null,
  subcategory text not null default '',
  confidence integer not null default 0,
  published_date timestamptz not null default now(),
  last_reviewed timestamptz not null default now(),
  related_items uuid[] not null default '{}',
  tags text[] not null default '{}',
  importance text not null check (importance in ('High', 'Medium', 'Low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.executive_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  importance text not null check (importance in ('High', 'Medium', 'Low')),
  related_knowledge uuid[] not null default '{}',
  search_tags text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'archived', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.research_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  summary text not null,
  source text not null,
  source_url text not null default '',
  confidence integer not null default 0,
  importance text not null check (importance in ('High', 'Medium', 'Low')),
  why_it_matters text not null,
  status text not null default 'Ready',
  tags text[] not null default '{}',
  queued_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.executive_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  summary text not null,
  confidence_score integer not null default 0,
  recommended_focus text not null,
  priorities jsonb not null default '[]'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  ai_prepared jsonb not null default '[]'::jsonb,
  workload_estimate text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  name text not null,
  description text not null,
  input_description text not null default '',
  output_description text not null default '',
  enabled boolean not null default true,
  search_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brain_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  action text not null,
  target text not null,
  created_at timestamptz not null default now()
);

create index knowledge_user_id_idx on public.knowledge (user_id);
create index executive_memory_user_id_idx on public.executive_memory (user_id);
create index research_queue_user_id_idx on public.research_queue (user_id);
create index research_queue_status_idx on public.research_queue (user_id, status);
create index executive_briefs_user_id_idx on public.executive_briefs (user_id);
create index skills_user_id_idx on public.skills (user_id);
create index brain_activity_user_id_idx on public.brain_activity (user_id);

alter table public.users enable row level security;
alter table public.knowledge enable row level security;
alter table public.executive_memory enable row level security;
alter table public.research_queue enable row level security;
alter table public.executive_briefs enable row level security;
alter table public.skills enable row level security;
alter table public.brain_activity enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users manage own knowledge"
  on public.knowledge for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own executive memory"
  on public.executive_memory for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own research queue"
  on public.research_queue for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own executive briefs"
  on public.executive_briefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users read global and own skills"
  on public.skills for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users manage own skills"
  on public.skills for insert
  with check (auth.uid() = user_id);

create policy "Users update own skills"
  on public.skills for update
  using (auth.uid() = user_id);

create policy "Users delete own skills"
  on public.skills for delete
  using (auth.uid() = user_id);

create policy "Users manage own brain activity"
  on public.brain_activity for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger knowledge_updated_at before update on public.knowledge
  for each row execute function public.set_updated_at();
create trigger executive_memory_updated_at before update on public.executive_memory
  for each row execute function public.set_updated_at();
create trigger research_queue_updated_at before update on public.research_queue
  for each row execute function public.set_updated_at();
create trigger executive_briefs_updated_at before update on public.executive_briefs
  for each row execute function public.set_updated_at();
create trigger skills_updated_at before update on public.skills
  for each row execute function public.set_updated_at();
