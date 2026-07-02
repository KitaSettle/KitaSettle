-- Release Candidate 2: Engineering hardening (RLS, indexes, integrity)

-- Prevent self-elevation on privileged user columns
create or replace function public.guard_users_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('request.jwt.claim.role', true) = 'service_role' then
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin
    or new.is_disabled is distinct from old.is_disabled
    or new.daily_ai_budget_usd is distinct from old.daily_ai_budget_usd
    or new.beta_notes is distinct from old.beta_notes
    or new.invited_at is distinct from old.invited_at then
    raise exception 'Cannot modify privileged account fields';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_users_privileged_columns on public.users;
create trigger guard_users_privileged_columns
  before update on public.users
  for each row execute function public.guard_users_privileged_columns();

-- Audit logs: server-only writes (service role bypasses RLS)
drop policy if exists audit_logs_insert_own on public.audit_logs;

-- Lock down seed function from authenticated callers
revoke all on function public.seed_default_user_data(uuid) from public;
revoke all on function public.seed_default_user_data(uuid) from authenticated, anon;

-- Decision timeline / learning: append-only for users
drop policy if exists decision_timeline_user_policy on public.decision_timeline_entries;

create policy decision_timeline_entries_select on public.decision_timeline_entries
  for select using (auth.uid() = user_id);

create policy decision_timeline_entries_insert on public.decision_timeline_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists decision_learning_events_user_policy on public.decision_learning_events;

create policy decision_learning_events_select on public.decision_learning_events
  for select using (auth.uid() = user_id);

create policy decision_learning_events_insert on public.decision_learning_events
  for insert with check (auth.uid() = user_id);

-- Performance indexes
create index if not exists executive_briefs_user_active_idx
  on public.executive_briefs (user_id, is_active, updated_at desc);

create index if not exists document_folders_user_provider_idx
  on public.document_folders (user_id, provider, selected);

create index if not exists document_index_user_modified_idx
  on public.document_index (user_id, modified_at desc);

create index if not exists executive_dna_recommendations_user_idx
  on public.executive_dna_recommendations (user_id, dismissed, priority desc);

create index if not exists sync_jobs_status_created_idx
  on public.sync_jobs (status, created_at desc);

create index if not exists audit_logs_resource_action_idx
  on public.audit_logs (resource, action, created_at desc);

create index if not exists decision_learning_events_decision_idx
  on public.decision_learning_events (decision_id);

create unique index if not exists users_email_lower_idx
  on public.users (lower(email));
