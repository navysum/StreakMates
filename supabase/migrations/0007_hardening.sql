-- ============================================================================
-- Security hardening
--
-- Findings from a review of the schema against the client. Run after
-- 0006_habit_order.sql.
--
-- Nothing here changes a feature. Every grant below covers exactly what the
-- app already writes.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. A shared habit could be stolen  (the serious one)
--
-- habits_update lets any member of the group update a group habit, and the
-- WITH CHECK is evaluated against the NEW row:
--
--     using       (owner_id = auth.uid() or is_group_member(group_id))
--     with check  (owner_id = auth.uid() or is_group_member(group_id))
--
-- So a member could pass USING as a group member, set owner_id to themselves
-- and group_id to null in the same statement, and pass WITH CHECK on the first
-- branch. The habit — and every other member's check-ins hanging off it —
-- becomes their private habit and vanishes from the group.
--
-- Setting group_id to a different group is worse than theft: check_ins_select
-- is can_see_habit(habit_id), so moving the habit hands its whole history to
-- people who were never in the original group.
--
-- RLS cannot express "this column may not change" — a policy sees OLD in
-- USING and NEW in WITH CHECK, never both. Column privileges and a trigger can.
-- ----------------------------------------------------------------------------

-- A table-level UPDATE grant covers every column, so it has to go before
-- column grants mean anything.
revoke update on public.habits from authenticated;

grant update (
  title, emoji, color, cadence, target_days, target_per_week,
  reminder_at, sort_order, group_id, archived_at
) on public.habits to authenticated;
-- Deliberately absent: id, owner_id, created_at.

-- group_id stays updatable because "make this habit shared" is a real feature,
-- so it needs the rule RLS could not express.
create or replace function public.habits_guard_move()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.group_id is distinct from old.group_id and old.owner_id <> auth.uid() then
    raise exception 'Only the person who created a habit can move it between groups.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists habits_guard_move on public.habits;
create trigger habits_guard_move
  before update on public.habits
  for each row execute function public.habits_guard_move();


-- ----------------------------------------------------------------------------
-- 2. The backfill window could be walked around
--
-- check_ins_insert bounds local_date to a few days either side of today, which
-- is what stops someone winning the leaderboard by filling in a month on a
-- Sunday night. check_ins_update did not:
--
--     using (user_id = auth.uid()) with check (user_id = auth.uid())
--
-- Insert a legitimate check-in for today, then update its local_date to any
-- date at all, and the window is gone. The same gap let habit_id be moved to
-- another habit after the fact.
--
-- The app only ever inserts and deletes check-ins, so nothing is lost by
-- closing this.
-- ----------------------------------------------------------------------------

revoke update on public.check_ins from authenticated;

-- note is the one field it is reasonable to change after the fact.
grant update (note) on public.check_ins to authenticated;

-- Defence in depth: if the column grant is ever widened again, the policy
-- still holds the line.
drop policy if exists check_ins_update on public.check_ins;
create policy check_ins_update on public.check_ins for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.can_see_habit(habit_id)
    and local_date between (current_date - 3) and (current_date + 1)
  );


-- ----------------------------------------------------------------------------
-- 3. Identity columns on profiles
--
-- profiles_update already pins the row to auth.uid(), so this changes no
-- outcome today. It states the intent in the grant rather than relying on the
-- policy alone.
-- ----------------------------------------------------------------------------

revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url, timezone) on public.profiles to authenticated;


-- ----------------------------------------------------------------------------
-- 4. Free text had no ceiling
--
-- name and title were capped; display_name and the emoji fields were not. A
-- display name is rendered in every member list and every feed row, so an
-- unbounded one is both a storage cost and a way to break other people's
-- screens.
-- ----------------------------------------------------------------------------

update public.profiles set display_name = left(display_name, 60)
  where length(display_name) > 60;

alter table public.profiles  drop constraint if exists profiles_display_name_len;
alter table public.profiles  add  constraint profiles_display_name_len
  check (length(display_name) <= 60);

update public.groups set emoji = left(emoji, 16) where length(emoji) > 16;
alter table public.groups    drop constraint if exists groups_emoji_len;
alter table public.groups    add  constraint groups_emoji_len
  check (emoji is null or length(emoji) <= 16);

update public.habits set emoji = left(emoji, 16) where length(emoji) > 16;
alter table public.habits    drop constraint if exists habits_emoji_len;
alter table public.habits    add  constraint habits_emoji_len
  check (emoji is null or length(emoji) <= 16);


-- ----------------------------------------------------------------------------
-- 5. Invite codes came from random()
--
-- random() is a PRNG, not a CSPRNG: it is seeded per session and its output is
-- predictable from earlier output. Codes are the only thing standing between a
-- stranger and a group, so they should come from a cryptographic source.
--
-- gen_random_uuid() is cryptographically random and built in, so this needs no
-- extension. Bytes at or above 248 are discarded rather than folded, because
-- 256 is not a multiple of 31 and folding would make the first eight letters
-- of the alphabet slightly likelier.
-- ----------------------------------------------------------------------------

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';  -- 31, no 0/O/1/I/L
  limit_    constant int  := 248;                               -- 8 * 31
  result   text;
  bytes    bytea;
  b        int;
  i        int;
begin
  loop
    result := '';
    while length(result) < 6 loop
      bytes := uuid_send(gen_random_uuid());
      for i in 0 .. 15 loop
        exit when length(result) >= 6;
        b := get_byte(bytes, i);
        if b < limit_ then
          result := result || substr(alphabet, 1 + (b % 31), 1);
        end if;
      end loop;
    end loop;
    exit when not exists (select 1 from public.groups where invite_code = result);
  end loop;
  return result;
end;
$$;

revoke all on function public.generate_invite_code() from public, anon, authenticated;
