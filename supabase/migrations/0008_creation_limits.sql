-- ============================================================================
-- Ceilings on how fast one account can create things
--
-- Guessing an invite code has been rate limited since 0001, but creating
-- groups and habits was not bounded at all: a single signed-in account could
-- insert rows until the disk filled. Nothing about row-level security stops
-- that, because every row is one the user is perfectly entitled to create.
--
-- Rates rather than totals, so someone who has used the app for two years is
-- not punished for it. Both ceilings are far above any real use — a person
-- makes a handful of groups ever, and twenty habits is a lot.
--
-- Run after 0007_hardening.sql.
-- ============================================================================

-- The count is over a rolling hour, so both checks need to find one person's
-- recent rows quickly rather than scanning the table.
create index if not exists groups_created_by_at_idx on public.groups (created_by, created_at desc);
create index if not exists habits_owner_created_idx on public.habits (owner_id, created_at desc);


-- ----------------------------------------------------------------------------
-- Groups
--
-- create_group is already a function, so the check goes straight in. Direct
-- inserts have never been possible: there is no INSERT policy on groups.
-- ----------------------------------------------------------------------------

create or replace function public.create_group(p_name text, p_emoji text default null)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group public.groups;
  recent    int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select count(*) into recent
  from public.groups
  where created_by = auth.uid() and created_at > now() - interval '1 hour';

  if recent >= 10 then
    raise exception 'That is a lot of groups at once. Try again in an hour.'
      using errcode = 'P0001';
  end if;

  insert into public.groups (name, emoji, invite_code, created_by)
  values (btrim(p_name), p_emoji, public.generate_invite_code(), auth.uid())
  returning * into new_group;

  insert into public.group_members (group_id, user_id, role)
  values (new_group.id, auth.uid(), 'owner');

  return new_group;
end;
$$;

grant execute on function public.create_group(text, text) to authenticated;


-- ----------------------------------------------------------------------------
-- Habits
--
-- These are inserted straight through the RLS policy rather than a function,
-- so the ceiling has to be a trigger. It counts what the inserting person owns,
-- which is the only thing they can create.
-- ----------------------------------------------------------------------------

create or replace function public.habits_guard_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare recent int;
begin
  -- Handovers during account deletion run as the definer, not as a client,
  -- and are not someone creating habits.
  if auth.uid() is null then
    return new;
  end if;

  select count(*) into recent
  from public.habits
  where owner_id = auth.uid() and created_at > now() - interval '1 hour';

  if recent >= 60 then
    raise exception 'That is a lot of habits at once. Try again in an hour.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists habits_guard_rate on public.habits;
create trigger habits_guard_rate
  before insert on public.habits
  for each row execute function public.habits_guard_rate();


-- ----------------------------------------------------------------------------
-- Choosing a username, for an account with no profile row
--
-- handle_new_user makes a profile row on signup, so normally there is nothing
-- to do here. But anyone whose account predates the trigger — someone who
-- signed up before 0001 was run, which is easy to do while setting a project
-- up — has no profile row at all.
--
-- For them, "choose a username" updated nothing. PostgREST reports no error
-- for an UPDATE that matches no rows, so the app saw success, refetched a
-- profile still without a username, and sent them straight back to the same
-- screen. A loop with nothing on screen to explain it.
--
-- The client cannot fix this with an upsert: PostgREST puts every column of
-- the payload into the ON CONFLICT DO UPDATE, id included, and 0007 revoked
-- UPDATE on profiles.id precisely so that identity cannot move. The upsert
-- would be refused for everyone, which is worse than the loop.
--
-- So it goes through a function instead. Running as the definer sidesteps the
-- column grant without loosening it, and profiles keeps having no INSERT
-- policy at all: creating a profile row stays something only the database
-- does, never a client.
-- ----------------------------------------------------------------------------

create or replace function public.set_username(p_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  insert into public.profiles (id, display_name, username)
  values (
    auth.uid(),
    coalesce(
      (select coalesce(
                u.raw_user_meta_data ->> 'full_name',
                u.raw_user_meta_data ->> 'name',
                split_part(coalesce(u.email, ''), '@', 1))
       from auth.users u where u.id = auth.uid()),
      'Someone'),
    btrim(p_username)
  )
  on conflict (id) do update set username = excluded.username;
end;
$$;

revoke all on function public.set_username(text) from public, anon;
grant execute on function public.set_username(text) to authenticated;

-- Heal anyone already in that state, so they never meet the loop at all.
insert into public.profiles (id, display_name)
select u.id, coalesce(
         u.raw_user_meta_data ->> 'full_name',
         u.raw_user_meta_data ->> 'name',
         split_part(coalesce(u.email, ''), '@', 1),
         'Someone')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
