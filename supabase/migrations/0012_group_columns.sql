-- ============================================================================
-- An owner could rewrite a group's invite code and its author
--
-- 0007 fixed this shape of bug on habits, check_ins and profiles but missed
-- groups. The policy is:
--
--     using      (is_group_owner(id))
--     with check (is_group_owner(id))
--
-- which says *who* may update the row and nothing at all about *what* they may
-- change. Row-level security cannot express "this column may not change" —
-- USING sees the old row, WITH CHECK sees the new one, and neither sees both —
-- so the restriction has to be a column grant, exactly as it was there.
--
-- Reproduced before the fix, as the group's owner:
--
--     update public.groups set invite_code = 'a' where id = ...;
--     -- invite_code | a       (was BJE2SJ, from the CSPRNG in 0007)
--
--     update public.groups set created_by = '<someone else>' where id = ...;
--     -- created_by | 22222222-2222-2222-2222-222222222222
--
-- The first is the one that matters. 0007 went to some trouble to generate
-- codes from gen_random_uuid() with rejection sampling, and 0008 rate-limited
-- guessing them; both are pointless if the column will accept a single
-- character. A one-character code has a search space of 31.
--
-- The second is attribution: created_by is who made the group, and it should
-- not be possible to say it was somebody else.
--
-- Run after 0011_task_realtime.sql.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Only the two columns the app actually edits
--
-- Group settings writes name and emoji. The invite code changes through
-- rotate_invite_code(), which is SECURITY DEFINER and therefore unaffected by
-- a grant made to `authenticated`. id, invite_code, created_by and created_at
-- become read-only over the API.
-- ----------------------------------------------------------------------------

revoke update on public.groups from authenticated;
grant update (name, emoji) on public.groups to authenticated;


-- ----------------------------------------------------------------------------
-- 2. The column will not hold a weak code either way
--
-- Defence in depth: the grant above stops the client, and this stops anything
-- that ever writes the column from a path nobody has thought about yet — a
-- future function, a migration, an admin fixing something by hand. The shape
-- is exactly what generate_invite_code() produces: six characters from the
-- 31-letter alphabet with 0, O, 1, I and L left out so nothing is misread.
--
-- Existing codes all came from that generator, so this validates immediately.
-- ----------------------------------------------------------------------------

alter table public.groups drop constraint if exists groups_invite_code_shape;
alter table public.groups add constraint groups_invite_code_shape
  check (invite_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$');
