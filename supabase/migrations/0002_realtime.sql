-- ============================================================================
-- Phase 3 — live updates for the group board
--
-- Adding a table to the supabase_realtime publication is what makes Supabase
-- broadcast its changes. Row-level security still applies, so people only ever
-- receive events for rows they could have read anyway.
--
-- Run this after 0001_init.sql.
-- ============================================================================

do $$
begin
  alter publication supabase_realtime add table public.check_ins;
exception
  when duplicate_object then null; -- already published, nothing to do
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.habits;
exception
  when duplicate_object then null;
end;
$$;
