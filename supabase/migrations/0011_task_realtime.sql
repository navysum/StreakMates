-- ============================================================================
-- Live updates for shared tasks
--
-- Shared tasks shipped in 0010 but were never added to the realtime
-- publication, and the client only ever subscribed to check_ins, habits and
-- reactions. So the one thing a shared task is for — seeing that somebody else
-- has done it — did not happen until the app was killed and reopened. Two
-- people could sit in the same list and each believe the other had not
-- started.
--
-- Also group_members, so a board and a roster fill in as people join rather
-- than a member appearing only on the next cold start.
--
-- Row-level security still applies to realtime, so nobody receives an event
-- for a row they could not already have read: a private task is broadcast to
-- its owner and to nobody else.
--
-- Run after 0010_shared_tasks.sql.
-- ============================================================================

do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception
  when duplicate_object then null; -- already published, nothing to do
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.task_completions;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.group_members;
exception
  when duplicate_object then null;
end;
$$;
