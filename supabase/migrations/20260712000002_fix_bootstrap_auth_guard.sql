-- Restore signup-safe auth guard: auth.uid() is null inside handle_new_user trigger.
-- Previous migration accidentally used "auth.uid() is distinct from p_user_id", which
-- treats null as forbidden and blocks all new signups.

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
  if auth.uid() is not null
    and auth.uid() is distinct from p_user_id
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
