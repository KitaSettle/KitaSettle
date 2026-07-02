-- Milestone 4: Executive Connect

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  services text[] not null default '{}',
  status text not null default 'disconnected',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  account_email text,
  metadata jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.calendar_sync_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null default 'google',
  sync_token text,
  last_sync_at timestamptz,
  last_sync_status text,
  events_synced integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null default 'google',
  external_id text not null,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  event_type text not null default 'event',
  category text not null default 'meeting',
  attendees jsonb not null default '[]'::jsonb,
  source_calendar text,
  raw_metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

create table public.document_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null default 'google',
  external_id text not null,
  name text not null,
  selected boolean not null default false,
  last_indexed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

create table public.document_index (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null default 'google',
  external_id text not null,
  folder_external_id text,
  name text not null,
  mime_type text,
  modified_at timestamptz,
  web_view_link text,
  size_bytes bigint,
  embedding jsonb,
  summary text,
  requires_review boolean not null default false,
  indexed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

create table public.email_sync_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null default 'google',
  history_id text,
  last_sync_at timestamptz,
  last_sync_status text,
  messages_synced integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.email_metadata (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null default 'google',
  external_id text not null,
  thread_id text,
  subject text not null default '',
  sender text not null default '',
  snippet text,
  body text,
  store_body boolean not null default false,
  received_at timestamptz not null,
  classification text not null default 'fyi',
  labels text[] not null default '{}',
  is_important boolean not null default false,
  is_read boolean not null default true,
  raw_metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

create table public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  job_type text not null,
  status text not null default 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index integration_connections_user_id_idx on public.integration_connections (user_id);
create index calendar_events_user_start_idx on public.calendar_events (user_id, start_at);
create index calendar_events_user_category_idx on public.calendar_events (user_id, category);
create index document_index_user_review_idx on public.document_index (user_id, requires_review);
create index email_metadata_user_received_idx on public.email_metadata (user_id, received_at desc);
create index email_metadata_user_classification_idx on public.email_metadata (user_id, classification);
create index sync_jobs_user_status_idx on public.sync_jobs (user_id, status);

alter table public.integration_connections enable row level security;
alter table public.calendar_sync_state enable row level security;
alter table public.calendar_events enable row level security;
alter table public.document_folders enable row level security;
alter table public.document_index enable row level security;
alter table public.email_sync_state enable row level security;
alter table public.email_metadata enable row level security;
alter table public.sync_jobs enable row level security;

create policy integration_connections_user_policy on public.integration_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy calendar_sync_state_user_policy on public.calendar_sync_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy calendar_events_user_policy on public.calendar_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy document_folders_user_policy on public.document_folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy document_index_user_policy on public.document_index
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy email_sync_state_user_policy on public.email_sync_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy email_metadata_user_policy on public.email_metadata
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy sync_jobs_user_policy on public.sync_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
