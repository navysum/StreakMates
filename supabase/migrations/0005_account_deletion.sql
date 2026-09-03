-- ============================================================================
-- Phase 5 — deleting your account
--
-- Apple requires an in-app way to delete an account, so this has to exist
-- before the app can ship. It is also the one destructive path in the whole
-- system, and two foreign keys make the naive version quietly harmful:
--
--   groups.created_by  ... on delete restrict  -- blocks the delete outright
--   habits.owner_id    ... on delete cascade   -- takes OTHER PEOPLE'S history
--
-- That second one is the dangerous one. A shared habit is owned by whoever
-- created it, so deleting your account would delete the habit and, through
-- check_ins, every check-in your friends ever made against it. Leaving must
-- not destroy other people's records.
--
-- Run after 0004_social.sql.
-- ============================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  g record;
  heir uuid;
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  -- 1. Hand over anything shared before anything cascades.
  for g in
    select gr.id
    from public.groups gr
    where gr.created_by = me
       or exists (
         select 1 from public.habits h
         where h.group_id = gr.id and h.owner_id = me
       )
  loop
    -- The longest-standing other member inherits. Deterministic, and it picks
    -- whoever is most likely still to be using the group.
    select gm.user_id into heir
    from public.group_members gm
    where gm.group_id = g.id and gm.user_id <> me
    order by gm.joined_at asc
    limit 1;

    if heir is null then
      -- Nobody left to inherit: the group and its habits go with the account.
      -- Nobody else's history is lost, because there is nobody else.
      delete from public.groups where id = g.id;
    else
      -- Shared habits change hands rather than cascading away, so the
      -- check-ins other members made against them survive.
      update public.habits
         set owner_id = heir
       where group_id = g.id and owner_id = me;

      update public.groups
         set created_by = heir
       where id = g.id and created_by = me;

      update public.group_members
         set role = 'owner'
       where group_id = g.id and user_id = heir;
    end if;
  end loop;

  -- 2. Everything genuinely yours goes: the profile cascade takes private
  --    habits, your check-ins, memberships, reactions and nudges with it.
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
