-- ============================================================================
-- Tasks you can share with a group
--
-- Two kinds, picked when the task is made, because they are genuinely
-- different jobs:
--
--   once      "Book the restaurant" — one person does it and it is done for
--             everyone. The app records who.
--   everyone  "Submit your expenses" — each person does their own, and you can
--             see who still has not.
--
-- Completion moves into its own table for both, and for private tasks too.
-- One rule instead of three: a task is done when the right completion rows
-- exist. It is the same shape check_ins already have for habits, which is
-- worth matching — the alternative was tasks.done_at for one kind and a table
-- for the other, and two mechanisms to keep in step forever.
--
-- Run after 0009_focus.sql.
-- ============================================================================

alter table public.tasks
  add column if not exists group_id   uuid references public.groups (id) on delete cascade,
  add column if not exists completion text not null default 'once'
    check (completion in ('once', 'everyone'));

create index if not exists tasks_group_idx on public.tasks (group_id, position);

create table if not exists public.task_completions (
  task_id  uuid not null references public.tasks (id) on delete cascade,
  user_id  uuid not null references public.profiles (id) on delete cascade,
  done_at  timestamptz not null default now(),
  primary key (task_id, user_id)
);

create index if not exists task_completions_user_idx on public.task_completions (user_id, done_at desc);

-- Carry across whatever was already ticked.
insert into public.task_completions (task_id, user_id, done_at)
select t.id, t.user_id, t.done_at
from public.tasks t
where t.done_at is not null
on conflict (task_id, user_id) do nothing;

-- tasks.done_at is left in place but no longer read or written, so a build
-- from before this migration keeps working rather than erroring on a missing
-- column. It can be dropped once everyone has updated.


-- ----------------------------------------------------------------------------
-- Who can see what
--
-- SECURITY DEFINER, like the group helpers in 0001: a policy on
-- task_completions that queried tasks, whose own policy queries groups, is a
-- chain worth keeping out of the planner.
-- ----------------------------------------------------------------------------

create or replace function public.can_see_task(p_task uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = p_task
      and (
        t.user_id = auth.uid()
        or (t.group_id is not null and public.is_group_member(t.group_id))
      )
  );
$$;

/**
 * A "one person does it" task in a group you are in.
 *
 * This is what lets anybody untick it. If Craig ticks off the restaurant
 * booking by mistake and then goes quiet, somebody else has to be able to put
 * it back — on an "everyone" task your tick is yours alone, and nobody else's
 * business to undo.
 */
create or replace function public.is_shared_once_task(p_task uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = p_task
      and t.completion = 'once'
      and t.group_id is not null
      and public.is_group_member(t.group_id)
  );
$$;

grant execute on function public.can_see_task(uuid)        to authenticated;
grant execute on function public.is_shared_once_task(uuid) to authenticated;


-- ----------------------------------------------------------------------------
-- Tasks: private stays private, shared is the group's
-- ----------------------------------------------------------------------------

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select
  using (
    user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id))
  );

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert
  with check (
    user_id = auth.uid()
    and (group_id is null or public.is_group_member(group_id))
  );

-- Any member may edit a shared task: rename it, reorder it, change its kind.
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update
  using (
    user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id))
  )
  with check (
    user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id))
  );

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete
  using (
    user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id))
  );


-- ----------------------------------------------------------------------------
-- The same two guards habits needed, for the same two reasons
-- ----------------------------------------------------------------------------

revoke update on public.tasks from authenticated;
grant update (title, done_at, position, group_id, completion) on public.tasks to authenticated;
-- Deliberately absent: id, user_id, created_at. A shared task cannot be taken.

/**
 * Moving a task between groups is not editing it, it is relocating it — and
 * it takes everyone's completions with it, in front of people who were never
 * in the original group. Same rule as habits: the person who made it decides.
 */
create or replace function public.tasks_guard_move()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.group_id is distinct from old.group_id and old.user_id <> auth.uid() then
    raise exception 'Only the person who added a task can move it between groups.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_guard_move on public.tasks;
create trigger tasks_guard_move
  before update on public.tasks
  for each row execute function public.tasks_guard_move();


-- ----------------------------------------------------------------------------
-- Completions
-- ----------------------------------------------------------------------------

alter table public.task_completions enable row level security;

drop policy if exists task_completions_select on public.task_completions;
create policy task_completions_select on public.task_completions for select
  using (public.can_see_task(task_id));

-- Always as yourself. Ticking a task off in someone else's name is never a
-- thing anyone needs to do.
drop policy if exists task_completions_insert on public.task_completions;
create policy task_completions_insert on public.task_completions for insert
  with check (user_id = auth.uid() and public.can_see_task(task_id));

drop policy if exists task_completions_delete on public.task_completions;
create policy task_completions_delete on public.task_completions for delete
  using (user_id = auth.uid() or public.is_shared_once_task(task_id));

-- Recorded, not edited: a completion is either there or it is not.
revoke update on public.task_completions from authenticated;
