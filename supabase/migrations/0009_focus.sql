-- ============================================================================
-- Tasks and focus sessions
--
-- The one-off work a habit is not: "email the landlord", not "run every day".
-- Private, always — a to-do list is personal admin, and the shared half of the
-- app is habits. There is deliberately no group_id here; if that changes it
-- should be a decision, not a column nobody noticed.
--
-- Run after 0008_creation_limits.sql.
-- ============================================================================

create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null check (length(btrim(title)) between 1 and 140),
  done_at    timestamptz,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);

-- The list is read as "mine, undone first, in my order".
create index if not exists tasks_user_idx on public.tasks (user_id, done_at, position);
create index if not exists tasks_user_created_idx on public.tasks (user_id, created_at desc);

/**
 * A completed stretch of focus, optionally against a task.
 *
 * task_id is ON DELETE SET NULL rather than CASCADE: deleting a task should
 * not quietly erase the hour you spent on it.
 */
create table if not exists public.focus_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  task_id    uuid references public.tasks (id) on delete set null,
  started_at timestamptz not null,
  minutes    smallint not null check (minutes between 1 and 240),
  created_at timestamptz not null default now()
);

create index if not exists focus_user_started_idx on public.focus_sessions (user_id, started_at desc);


-- ----------------------------------------------------------------------------
-- Row-level security
--
-- Yours alone in every direction. Nobody else can see what you are working on,
-- or that you are working at all.
-- ----------------------------------------------------------------------------

alter table public.tasks           enable row level security;
alter table public.focus_sessions  enable row level security;

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select using (user_id = auth.uid());

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert with check (user_id = auth.uid());

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete using (user_id = auth.uid());

drop policy if exists focus_select on public.focus_sessions;
create policy focus_select on public.focus_sessions for select using (user_id = auth.uid());

/**
 * Recorded, not edited. A session is a fact about the past, so there is no
 * UPDATE policy at all, and started_at has to be recent — the same reasoning
 * as the check-in window, so a quiet evening cannot become a productive month.
 */
drop policy if exists focus_insert on public.focus_sessions;
create policy focus_insert on public.focus_sessions for insert
  with check (
    user_id = auth.uid()
    and started_at > now() - interval '1 day'
    and started_at < now() + interval '1 hour'
  );

drop policy if exists focus_delete on public.focus_sessions;
create policy focus_delete on public.focus_sessions for delete using (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- Column grants, as everywhere else: identity does not move
-- ----------------------------------------------------------------------------

revoke update on public.tasks from authenticated;
grant update (title, done_at, position) on public.tasks to authenticated;
-- Deliberately absent: id, user_id, created_at.

/**
 * A session is recorded, never edited. Having no UPDATE policy already makes
 * an edit affect no rows, but that is safety by omission: the next person to
 * add a policy here would quietly undo it. Taking the privilege away says so
 * out loud, and turns a silent no-op into a refusal.
 */
revoke update on public.focus_sessions from authenticated;


-- ----------------------------------------------------------------------------
-- A ceiling, for the same reason groups and habits have one
--
-- Every task row is one the user is entitled to create, so only a rate limit
-- bounds them. 200 an hour is far past any real list.
-- ----------------------------------------------------------------------------

create or replace function public.tasks_guard_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare recent int;
begin
  if auth.uid() is null then
    return new;
  end if;

  select count(*) into recent
  from public.tasks
  where user_id = auth.uid() and created_at > now() - interval '1 hour';

  if recent >= 200 then
    raise exception 'That is a lot of tasks at once. Try again in an hour.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_guard_rate on public.tasks;
create trigger tasks_guard_rate
  before insert on public.tasks
  for each row execute function public.tasks_guard_rate();
