-- Fix new-user onboarding: idempotent profile bootstrap for auth users missing app data.

create or replace function public.bootstrap_user_account(
  p_user_id uuid,
  p_email text,
  p_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_name text;
  safe_email text;
begin
  if auth.uid() is distinct from p_user_id
    and coalesce(current_setting('request.jwt.claim.role', true), '') is distinct from 'service_role' then
    raise exception 'Forbidden';
  end if;

  safe_email := coalesce(nullif(trim(p_email), ''), '');
  safe_name := coalesce(
    nullif(trim(p_name), ''),
    nullif(split_part(safe_email, '@', 1), ''),
    'Executive'
  );

  insert into public.users (id, name, email)
  values (p_user_id, safe_name, safe_email)
  on conflict (id) do update
    set email = excluded.email,
        name = case
          when public.users.name is null or trim(public.users.name) = '' then excluded.name
          else public.users.name
        end,
        updated_at = now();

  if not exists (
    select 1 from public.executive_briefs where user_id = p_user_id limit 1
  ) then
    perform public.seed_default_user_data(p_user_id);
  end if;

  insert into public.executive_dna_profiles (
    user_id,
    profile,
    overall_confidence,
    interview_complete,
    version
  )
  select p_user_id, '{}'::jsonb, 0, false, 1
  where not exists (
    select 1 from public.executive_dna_profiles where user_id = p_user_id
  );
end;
$$;

revoke all on function public.bootstrap_user_account(uuid, text, text) from public;
grant execute on function public.bootstrap_user_account(uuid, text, text) to authenticated;
grant execute on function public.bootstrap_user_account(uuid, text, text) to service_role;

-- Ensure auth trigger still exists for future signups.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.bootstrap_user_account(
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
