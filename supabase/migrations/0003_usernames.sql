-- ============================================================================
-- Usernames
--
-- Google gives everyone a display name, and display names collide — two people
-- called Craig are indistinguishable on a board. A username is the handle that
-- is guaranteed to be theirs alone.
--
-- Run after 0002_realtime.sql.
-- ============================================================================

alter table public.profiles add column if not exists username text;

-- Case-insensitive uniqueness across the whole app: "craig" and "Craig" are the
-- same handle, and only one person can hold it. The database is the only place
-- this can be enforced honestly — two people can pick the same free username at
-- the same moment, and the index is what decides between them.
create unique index if not exists profiles_username_unique
  on public.profiles (lower(username));

do $$
begin
  alter table public.profiles add constraint profiles_username_format
    check (username is null or username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,19}$');
exception
  when duplicate_object then null;
end;
$$;

-- Reading another profile requires sharing a group, so a client cannot check
-- availability by querying the table. This answers only yes or no, and reveals
-- nothing else about whoever holds it.
create or replace function public.username_available(p_username text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(btrim(p_username))
  );
$$;

grant execute on function public.username_available(text) to authenticated;
