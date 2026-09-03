-- ============================================================================
-- Habits With Friends — Phases 1 and 2
--
-- Profiles, habits and check-ins (Phase 1); groups, membership and invite
-- codes (Phase 2). Shared habits and the group board land in Phase 3.
--
-- Run this whole file once in the Supabase SQL editor.
-- ============================================================================

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url  text,
  timezone    text not null default 'UTC',
  created_at  timestamptz not null default now()
);

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) between 1 and 60),
  emoji       text,
  invite_code text not null unique,
  created_by  uuid not null references public.profiles (id) on delete restrict,
  created_at  timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_idx on public.group_members (user_id);

create table if not exists public.habits (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  group_id    uuid references public.groups (id) on delete cascade,
  title       text not null check (length(btrim(title)) between 1 and 80),
  emoji       text,
  color       text not null default 'green'
                check (color in ('green','amber','blue','purple','teal','coral')),
  cadence     text not null default 'daily'
                check (cadence in ('daily', 'days', 'weekly')),
  -- ISO weekdays for cadence 'days': 1 = Monday … 7 = Sunday
  target_days smallint[] not null default '{}',
  -- times per week for cadence 'weekly'
  target_per_week smallint not null default 1 check (target_per_week between 1 and 7),
  reminder_at time,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  archived_at timestamptz,
  constraint habits_days_present check (
    cadence <> 'days' or array_length(target_days, 1) between 1 and 7
  )
);

create index if not exists habits_owner_idx on public.habits (owner_id) where archived_at is null;
create index if not exists habits_group_idx on public.habits (group_id) where group_id is not null;

create table if not exists public.check_ins (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references public.habits (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  -- The day this counts for, computed on the device from the user's timezone.
  -- Never derive it from created_at: 11pm in Sydney is a different day to
  -- 8am in London for the same instant.
  local_date date not null,
  note       text check (note is null or length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (habit_id, user_id, local_date)
);

create index if not exists check_ins_habit_user_idx
  on public.check_ins (habit_id, user_id, local_date desc);

-- Rate-limit ledger for invite-code lookups. Without it, a billion codes is
-- only a few days of brute force.
create table if not exists public.invite_code_attempts (
  id           bigserial primary key,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists invite_code_attempts_user_idx
  on public.invite_code_attempts (user_id, attempted_at desc);

-- ============================================================================
-- New users get a profile automatically
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Someone'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Membership helpers
--
-- These are SECURITY DEFINER so they read group_members with RLS bypassed.
-- A policy on group_members that queries group_members directly would make
-- Postgres check the rule to check the rule — infinite recursion, and every
-- query fails. Calling these from the policies avoids that entirely.
-- ============================================================================

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.shares_group_with(other_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid() and theirs.user_id = other_id
  );
$$;

create or replace function public.can_see_habit(hid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.habits h
    where h.id = hid
      and (
        h.owner_id = auth.uid()
        or (h.group_id is not null and public.is_group_member(h.group_id))
      )
  );
$$;

-- ============================================================================
-- Row-level security
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.groups              enable row level security;
alter table public.group_members       enable row level security;
alter table public.habits              enable row level security;
alter table public.check_ins           enable row level security;
alter table public.invite_code_attempts enable row level security;

-- profiles: yourself, plus anyone you share a group with
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.shares_group_with(id));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- groups: members only. Creation and joining go through the functions below,
-- so there is deliberately no INSERT policy and no way to look a group up by
-- its code from the client — that is what stops codes being scraped.
drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups for select
  using (public.is_group_member(id));

drop policy if exists groups_update on public.groups;
create policy groups_update on public.groups for update
  using (public.is_group_owner(id)) with check (public.is_group_owner(id));

drop policy if exists groups_delete on public.groups;
create policy groups_delete on public.groups for delete
  using (public.is_group_owner(id));

-- group_members: visible to the group; you may remove yourself, owners may
-- remove anyone.
drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members for select
  using (public.is_group_member(group_id));

drop policy if exists group_members_delete on public.group_members;
create policy group_members_delete on public.group_members for delete
  using (user_id = auth.uid() or public.is_group_owner(group_id));

-- habits: your own, or any habit belonging to a group you are in
drop policy if exists habits_select on public.habits;
create policy habits_select on public.habits for select
  using (
    owner_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id))
  );

drop policy if exists habits_insert on public.habits;
create policy habits_insert on public.habits for insert
  with check (
    owner_id = auth.uid()
    and (group_id is null or public.is_group_member(group_id))
  );

drop policy if exists habits_update on public.habits;
create policy habits_update on public.habits for update
  using (
    owner_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id))
  )
  with check (
    owner_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id))
  );

-- Deleting a group habit destroys other people's history, so only the group
-- owner may. Private habits are the owner's alone.
drop policy if exists habits_delete on public.habits;
create policy habits_delete on public.habits for delete
  using (
    case
      when group_id is null then owner_id = auth.uid()
      else public.is_group_owner(group_id)
    end
  );

-- check_ins: readable by anyone who can see the habit; writable only as
-- yourself, and only for a day close to today.
--
-- The window is what stops the leaderboard being won by backfilling a month
-- on a Sunday night. It is generous enough for the offline queue, which sends
-- yesterday's check-in today: local_date is the day it counts for, created_at
-- is when it arrived.
drop policy if exists check_ins_select on public.check_ins;
create policy check_ins_select on public.check_ins for select
  using (user_id = auth.uid() or public.can_see_habit(habit_id));

drop policy if exists check_ins_insert on public.check_ins;
create policy check_ins_insert on public.check_ins for insert
  with check (
    user_id = auth.uid()
    and public.can_see_habit(habit_id)
    -- +1 day of slack because local_date is a device-local day and the server
    -- compares against a UTC one.
    and local_date between (current_date - 3) and (current_date + 1)
  );

drop policy if exists check_ins_update on public.check_ins;
create policy check_ins_update on public.check_ins for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists check_ins_delete on public.check_ins;
create policy check_ins_delete on public.check_ins for delete
  using (user_id = auth.uid());

-- invite_code_attempts: the ledger is written by SECURITY DEFINER functions
-- only. No policies, so clients can neither read nor forge it.

-- ============================================================================
-- Invite codes
-- ============================================================================

-- Crockford-ish alphabet: no 0, O, 1, I or L, so nothing gets misread across
-- a pub table. 31 characters over 6 places is about 887 million codes.
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text;
  i int;
begin
  loop
    result := '';
    for i in 1 .. 6 loop
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.groups where invite_code = result);
  end loop;
  return result;
end;
$$;

create or replace function public.assert_invite_rate_limit()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select count(*) into recent
  from public.invite_code_attempts
  where user_id = auth.uid() and attempted_at > now() - interval '1 hour';

  if recent >= 10 then
    raise exception 'Too many code attempts. Try again in an hour.'
      using errcode = 'P0001';
  end if;

  insert into public.invite_code_attempts (user_id) values (auth.uid());
end;
$$;

create or replace function public.create_group(p_name text, p_emoji text default null)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  insert into public.groups (name, emoji, invite_code, created_by)
  values (btrim(p_name), p_emoji, public.generate_invite_code(), auth.uid())
  returning * into new_group;

  insert into public.group_members (group_id, user_id, role)
  values (new_group.id, auth.uid(), 'owner');

  return new_group;
end;
$$;

-- What someone sees before committing to join: enough to recognise the group,
-- nothing more. Rate limited, because this is the lookup worth brute-forcing.
create or replace function public.preview_group_by_code(p_code text)
returns table (id uuid, name text, emoji text, member_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_invite_rate_limit();

  return query
  select g.id, g.name, g.emoji, count(gm.user_id)
  from public.groups g
  left join public.group_members gm on gm.group_id = g.id
  where g.invite_code = upper(btrim(p_code))
  group by g.id, g.name, g.emoji;
end;
$$;

create or replace function public.join_group_with_code(p_code text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.groups;
begin
  perform public.assert_invite_rate_limit();

  select * into target from public.groups
  where invite_code = upper(btrim(p_code));

  if target.id is null then
    raise exception 'No group with that code' using errcode = 'P0002';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return target;
end;
$$;

-- Owners can roll a code if it leaks.
create or replace function public.rotate_invite_code(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  fresh text;
begin
  if not public.is_group_owner(p_group_id) then
    raise exception 'Only the group owner can change the code' using errcode = '42501';
  end if;

  fresh := public.generate_invite_code();
  update public.groups set invite_code = fresh where id = p_group_id;
  return fresh;
end;
$$;

-- ============================================================================
-- Function permissions
-- ============================================================================

revoke all on function public.assert_invite_rate_limit() from public, anon, authenticated;
revoke all on function public.generate_invite_code() from public, anon, authenticated;

grant execute on function public.create_group(text, text)          to authenticated;
grant execute on function public.join_group_with_code(text)        to authenticated;
grant execute on function public.preview_group_by_code(text)       to authenticated;
grant execute on function public.rotate_invite_code(uuid)          to authenticated;
grant execute on function public.is_group_member(uuid)             to authenticated;
grant execute on function public.is_group_owner(uuid)              to authenticated;
grant execute on function public.shares_group_with(uuid)           to authenticated;
grant execute on function public.can_see_habit(uuid)               to authenticated;
