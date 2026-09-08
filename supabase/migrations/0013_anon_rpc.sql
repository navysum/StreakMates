-- ============================================================================
-- A stranger could enumerate every username on the platform
--
-- The app is served from a public URL now, so the question "what does someone
-- with the anon key, curl and no account get" changed from theoretical to
-- routine. Every table answers it correctly — all twelve are invisible signed
-- out, and the attack suite now says so for each of them. The functions did
-- not.
--
-- Supabase's default privileges grant EXECUTE on new functions to anon as well
-- as authenticated, so every SECURITY DEFINER function in this schema was
-- callable by a signed-out request. Four of the five the client actually calls
-- check for themselves and refuse:
--
--   preview_group_by_code   Not signed in
--   join_group_with_code    Not signed in
--   create_group            Not signed in
--   rotate_invite_code      Only the group owner can change the code
--
-- username_available did not. It is a bare existence check, so a stranger
-- could walk a wordlist through it and learn every handle on the platform, at
-- whatever rate they liked, without ever creating an account. Handles are
-- semi-public — they are visible inside a group — but a complete list of them
-- is a different thing from seeing the handles of people you share a group
-- with, and people reuse handles across services.
--
-- Two fixes rather than one, because they fail differently. The guard is the
-- real one and travels with the function; the revoke means an unauthenticated
-- call does not reach it at all.
--
-- Run after 0012_group_columns.sql.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. The function refuses a caller who is not signed in
--
-- Safe for the sign-up flow it exists to serve: a person picking their first
-- username already has a session — they have just come back from Google — they
-- simply have no profile row yet. auth.uid() is set well before this is called.
--
-- Rewritten in plpgsql because a sql function has nowhere to raise from.
-- ----------------------------------------------------------------------------

create or replace function public.username_available(p_username text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  return not exists (
    select 1 from public.profiles
    where lower(username) = lower(btrim(p_username))
  );
end;
$$;


-- ----------------------------------------------------------------------------
-- 2. anon cannot call any of the client's RPCs
--
-- None of these is reachable before sign-in in the app: the gate sends a
-- signed-out visitor to the sign-in screen and nothing else renders. So there
-- is no reason for the anon role to hold EXECUTE on them, and taking it away
-- means an unauthenticated request is refused at the door rather than by the
-- function's own first line.
--
-- Deliberately NOT revoked: is_group_member, is_group_owner, can_see_habit,
-- can_see_check_in, can_see_task, is_shared_once_task, shares_group_with and
-- the guard triggers. Those are called *inside* RLS policies, which evaluate as
-- the querying role — revoking them would turn a signed-out read from a clean
-- empty result into a permission error. Empty is the better answer, and it is
-- what the suite asserts.
-- ----------------------------------------------------------------------------

revoke execute on function public.username_available(text)              from anon;
revoke execute on function public.preview_group_by_code(text)           from anon;
revoke execute on function public.join_group_with_code(text)            from anon;
revoke execute on function public.create_group(text, text)              from anon;
revoke execute on function public.rotate_invite_code(uuid)              from anon;

-- The revoke above removes what default privileges granted; this re-states the
-- grant the app actually needs, so the intent is readable in one place.
grant execute on function public.username_available(text)               to authenticated;
grant execute on function public.preview_group_by_code(text)            to authenticated;
grant execute on function public.join_group_with_code(text)             to authenticated;
grant execute on function public.create_group(text, text)               to authenticated;
grant execute on function public.rotate_invite_code(uuid)               to authenticated;
