-- Fix Supabase database linter findings (security advisory).
--
-- 1. public.profiles and public.knowledge_items were created without
--    security_invoker, so they ran with the view owner's privileges
--    instead of the querying user's -- silently bypassing the RLS
--    policies on the underlying users/knowledge tables for anyone
--    querying through the views. Force them to respect the querying
--    user's RLS context like every other user-data path in this app.
--
-- 2. public.platform_settings never had RLS enabled at all (unlike
--    beta_invites, created in the same migration, which correctly does).
--    App access already goes through the service-role client (which
--    bypasses RLS regardless of policies), so this table was readable --
--    and potentially writable -- by anyone using the public anon key via
--    the REST API. Enabling RLS with zero policies matches the existing
--    beta_invites pattern: service-role only, everyone else denied.

alter view public.profiles set (security_invoker = on);
alter view public.knowledge_items set (security_invoker = on);

alter table public.platform_settings enable row level security;
