-- ============================================================================
-- Phase 4 — reactions and nudges
--
-- The activity feed, leaderboard and habit stats need no tables: they are all
-- derived from check_ins, which is a good sign the core model was right. Only
-- the two genuinely new things live here.
--
-- Run after 0003_usernames.sql.
-- ============================================================================

-- A small, fixed set. An open emoji field invites things you would not want
-- attached to a friend's check-in.
create table if not exists public.reactions (
  check_in_id uuid not null references public.check_ins (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  emoji       text not null check (emoji in ('🔥', '👏', '💪', '🙌', '😂')),
  created_at  timestamptz not null default now(),
  primary key (check_in_id, user_id, emoji)
);

create index if not exists reactions_check_in_idx on public.reactions (check_in_id);

-- `nudge_day` is stored rather than derived so the unique index below can use
-- it: current_date depends on the session timezone, which makes an expression
-- index on it non-immutable and therefore illegal.
create table if not exists public.nudges (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references public.habits (id) on delete cascade,
  from_user  uuid not null references public.profiles (id) on delete cascade,
  to_user    uuid not null references public.profiles (id) on delete cascade,
  nudge_day  date not null default current_date,
  created_at timestamptz not null default now(),
  constraint nudges_not_self check (from_user <> to_user)
);

-- Social pressure is the feature; being pestered is how the app gets deleted.
-- One nudge per person, per person, per habit, per day — enforced here rather
-- than in the app, because the app is not the only thing that can write.
create unique index if not exists nudges_one_a_day
  on public.nudges (from_user, to_user, habit_id, nudge_day);

create index if not exists nudges_to_user_idx on public.nudges (to_user, created_at desc);

-- ============================================================================
-- Helpers
-- ============================================================================

create or replace function public.can_see_check_in(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.check_ins c
    where c.id = cid
      and (c.user_id = auth.uid() or public.can_see_habit(c.habit_id))
  );
$$;

-- ============================================================================
-- Row-level security
-- ============================================================================

alter table public.reactions enable row level security;
alter table public.nudges    enable row level security;

-- Reactions are visible to anyone who can see the check-in they are on, and
-- writable only as yourself.
drop policy if exists reactions_select on public.reactions;
create policy reactions_select on public.reactions for select
  using (public.can_see_check_in(check_in_id));

drop policy if exists reactions_insert on public.reactions;
create policy reactions_insert on public.reactions for insert
  with check (user_id = auth.uid() and public.can_see_check_in(check_in_id));

drop policy if exists reactions_delete on public.reactions;
create policy reactions_delete on public.reactions for delete
  using (user_id = auth.uid());

-- A nudge is between two people. Nobody else needs to see it, including the
-- rest of the group.
drop policy if exists nudges_select on public.nudges;
create policy nudges_select on public.nudges for select
  using (from_user = auth.uid() or to_user = auth.uid());

-- You may only send as yourself, only about a habit you can both see, and only
-- to someone you actually share a group with.
drop policy if exists nudges_insert on public.nudges;
create policy nudges_insert on public.nudges for insert
  with check (
    from_user = auth.uid()
    and public.can_see_habit(habit_id)
    and public.shares_group_with(to_user)
    and nudge_day = current_date
  );

grant execute on function public.can_see_check_in(uuid) to authenticated;

-- ============================================================================
-- Live updates
-- ============================================================================

do $$
begin
  alter publication supabase_realtime add table public.reactions;
exception
  when duplicate_object then null;
end;
$$;
