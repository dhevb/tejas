-- PR #65 isolated Preview ONLY. Do NOT run on Production.
-- Minimal extract from supabase/migrations/20261118000200_tejas_learning_portal_durable.sql
-- Required for recovery-token staff login session versioning.

begin;

create table if not exists public.tejas_staff_sessions (
  subject text primary key,
  session_version integer not null default 1 check (session_version > 0),
  updated_at timestamptz not null default now()
);

create or replace function public.tejas_staff_bump_session(p_subject text)
returns integer
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  next_version integer;
begin
  if p_subject is null or not pg_catalog.regexp_like(p_subject, '^[A-Za-z0-9-]{1,80}$') then
    raise exception 'invalid staff subject';
  end if;
  insert into public.tejas_staff_sessions as sessions (subject, session_version)
  values (p_subject, 1)
  on conflict (subject) do update
  set session_version = sessions.session_version + 1,
      updated_at = pg_catalog.now()
  returning session_version into next_version;
  return next_version;
end;
$$;

revoke all on function public.tejas_staff_bump_session(text) from public, anon, authenticated;
grant execute on function public.tejas_staff_bump_session(text) to service_role;

alter table public.tejas_staff_sessions enable row level security;

commit;
