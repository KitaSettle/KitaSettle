-- KitaSettle Sprint 8: Canonical table names + trusted_sources

-- profiles (Sprint 8 naming) maps to users from Sprint 7
create or replace view public.profiles as
  select id, name, email, created_at, updated_at
  from public.users;

-- knowledge_items (Sprint 8 naming) maps to knowledge from Sprint 7
create or replace view public.knowledge_items as
  select *
  from public.knowledge;

-- Global trusted source catalog
create table if not exists public.trusted_sources (
  id text primary key,
  name text not null,
  category text not null,
  description text not null default '',
  search_tags text[] not null default '{}',
  url text not null default '',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trusted_sources enable row level security;

create policy "Authenticated users can read trusted sources"
  on public.trusted_sources for select
  to authenticated
  using (enabled = true);

insert into public.trusted_sources (id, name, category, description, search_tags) values
  ('ts-icao', 'ICAO', 'Aviation', 'Global standards for civil aviation safety and training.', array['ICAO', 'RVSM', 'CBTA']),
  ('ts-caam', 'CAAM', 'Aviation', 'Malaysia civil aviation regulations and circulars.', array['CAAM', 'CBTA']),
  ('ts-faa', 'FAA', 'Aviation', 'US aviation regulations, advisories, and guidance.', array['CBTA', 'RVSM']),
  ('ts-easa', 'EASA', 'Aviation', 'European aviation safety rules and compliance updates.', array['RVSM', 'CBTA']),
  ('ts-boeing', 'Boeing', 'Aviation', 'Technical bulletins, fleet updates, and industry insights.', array['RVSM']),
  ('ts-iata', 'IATA', 'Aviation', 'Airline operations, training trends, and market signals.', array['CBTA']),
  ('ts-cidb', 'CIDB', 'Construction', 'Malaysia construction standards and project compliance.', array['Proposal', 'Steelworks']),
  ('ts-mcmc', 'MCMC', 'Regulatory', 'Communications and digital policy affecting operations.', array[]::text[]),
  ('ts-hbr', 'Harvard Business Review', 'Leadership', 'Executive decision-making and organisational strategy.', array['Leadership']),
  ('ts-mckinsey', 'McKinsey', 'Strategy', 'Industry analysis and transformation frameworks.', array['Leadership', 'Finance'])
on conflict (id) do nothing;
