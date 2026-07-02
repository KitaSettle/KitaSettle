-- Milestone 6.5: Give this to Kita — delegation intake records

create table if not exists public.intake_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  source_type text not null,
  source_label text not null,
  mime_type text,
  content_preview text not null default '',
  analysis jsonb not null default '{}'::jsonb,
  status text not null default 'completed',
  knowledge_id uuid references public.knowledge (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists intake_items_user_created_idx
  on public.intake_items (user_id, created_at desc);

alter table public.intake_items enable row level security;

create policy intake_items_user_policy on public.intake_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.intake_items is 'User-delegated documents and information intake via Give this to Kita.';
