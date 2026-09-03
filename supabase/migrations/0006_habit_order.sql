-- ============================================================================
-- Per-person habit order
--
-- habits.sort_order sat on the habit row, and a shared habit is one row that
-- every member of the group can update. So dragging your list into the order
-- you like silently reordered it for your friends as well.
--
-- Display order is a personal preference, so it cannot live on shared data.
-- It moves to a row per person per habit.
--
-- habits.sort_order is left in place but no longer read or written, so an app
-- build from before this migration keeps working. It can be dropped once
-- everyone has updated.
--
-- Run after 0005_account_deletion.sql.
-- ============================================================================

create table if not exists public.habit_order (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  position int  not null,
  primary key (user_id, habit_id)
);

create index if not exists habit_order_user_idx on public.habit_order (user_id, position);

alter table public.habit_order enable row level security;

-- Yours alone, in every direction. Nobody can see how you arrange your list,
-- let alone change it.
drop policy if exists habit_order_select on public.habit_order;
create policy habit_order_select on public.habit_order for select
  using (user_id = auth.uid());

drop policy if exists habit_order_write on public.habit_order;
create policy habit_order_write on public.habit_order for insert
  with check (user_id = auth.uid() and public.can_see_habit(habit_id));

drop policy if exists habit_order_update on public.habit_order;
create policy habit_order_update on public.habit_order for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists habit_order_delete on public.habit_order;
create policy habit_order_delete on public.habit_order for delete
  using (user_id = auth.uid());

-- ============================================================================
-- Carry the existing order across, so nobody's list jumps about
-- ============================================================================

-- Owners keep the order they had.
insert into public.habit_order (user_id, habit_id, position)
select h.owner_id, h.id, h.sort_order
from public.habits h
on conflict (user_id, habit_id) do nothing;

-- Everyone else in a group starts from the same arrangement, and is free to
-- change it without touching anyone else's.
insert into public.habit_order (user_id, habit_id, position)
select gm.user_id, h.id, h.sort_order
from public.habits h
join public.group_members gm on gm.group_id = h.group_id
where h.group_id is not null
on conflict (user_id, habit_id) do nothing;
