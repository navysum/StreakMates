-- ============================================================================
-- Attacking the policies
--
-- The app talks straight to Postgres, so RLS is the whole access control
-- layer. Anything not forbidden here is something a user can do with curl and
-- the anon key. Every policy should have a line in this file trying to break
-- it; a policy nobody has attacked has not been tested.
--
-- Cast:
--   alice    owns Sunrise Club, and a shared habit in it
--   bob      a plain member of Sunrise Club
--   mallory  in no group of alice's — an outsider with a valid account
-- ============================================================================

\set QUIET on
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'alice@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bob@example.com'),
  ('cccccccc-0000-0000-0000-000000000003', 'mallory@example.com');

-- Plain values. :'name' quotes them for SQL; quote_literal(:'name') quotes
-- them for a statement being built as a string. Embedding quotes in the
-- variable itself double-quotes them and every attack fails on syntax instead
-- of on a policy, which looks exactly like a pass.
\set alice   aaaaaaaa-0000-0000-0000-000000000001
\set bob     bbbbbbbb-0000-0000-0000-000000000002
\set mallory cccccccc-0000-0000-0000-000000000003

-- ---------------------------------------------------------------------------
-- Set-up, as the people themselves
-- ---------------------------------------------------------------------------
set role authenticated;

select tests.as_user(:'alice');
update public.profiles set username = 'alice' where id = auth.uid();
select id as gid, invite_code as code from public.create_group('Sunrise Club', 'S') \gset
insert into public.habits (owner_id, group_id, title) values (auth.uid(), :'gid', 'Morning run');
insert into public.habits (owner_id, title) values (auth.uid(), 'Private journal');

-- Ids are captured here, as their owner, so the attacks below can target a
-- real row. An attack that selects through RLS finds nothing and proves only
-- that the SELECT policy works — the question is whether a leaked id helps.
select id as shared_habit from public.habits where title = 'Morning run' \gset
select id as private_habit from public.habits where title = 'Private journal' \gset
insert into public.check_ins (habit_id, user_id, local_date)
  values (:'shared_habit', auth.uid(), current_date),
         (:'private_habit', auth.uid(), current_date);
select id as alice_checkin from public.check_ins where habit_id = :'shared_habit' \gset

select tests.as_user(:'bob');
update public.profiles set username = 'bob' where id = auth.uid();
select 1 from public.join_group_with_code(:'code');

select tests.as_user(:'mallory');
update public.profiles set username = 'mallory' where id = auth.uid();
select id as mgid from public.create_group('Mallory Club') \gset

\echo ''
\echo '=== 1. An outsider (mallory) against a group she is not in ==='
select tests.as_user(:'mallory');

select tests.invisible('the group itself',            'select * from public.groups where name = ''Sunrise Club''');
select tests.invisible('its members',                 'select * from public.group_members where group_id = ' || quote_literal(:'gid'));
select tests.invisible('its shared habit',            'select * from public.habits where title = ''Morning run''');
select tests.invisible('anyone''s check-ins',         'select * from public.check_ins where user_id <> auth.uid()');
select tests.invisible('alice''s profile',            'select * from public.profiles where username = ''alice''');
select tests.invisible('the invite-code ledger',      'select * from public.invite_code_attempts');
select tests.invisible('reactions she cannot see',    'select * from public.reactions');
select tests.invisible('nudges between other people', 'select * from public.nudges');
select tests.invisible('other people''s habit order', 'select * from public.habit_order where user_id <> auth.uid()');

select tests.denied('joining by writing group_members directly',
  'insert into public.group_members (group_id, user_id, role) values (' || quote_literal(:'gid') || ', auth.uid(), ''member'')');
select tests.denied('creating a group row directly (bypassing the function)',
  'insert into public.groups (name, invite_code, created_by) values (''Sneaky'', ''ZZZZZZ'', auth.uid())');
select tests.denied('writing the rate-limit ledger',
  'insert into public.invite_code_attempts (user_id) values (auth.uid())');
-- The id is handed to her, standing in for one leaked some other way.
select tests.denied('checking in on a habit she cannot see, using its id',
  'insert into public.check_ins (habit_id, user_id, local_date) values (' || quote_literal(:'shared_habit') || ', auth.uid(), current_date)');
select tests.denied('checking in on someone''s PRIVATE habit, using its id',
  'insert into public.check_ins (habit_id, user_id, local_date) values (' || quote_literal(:'private_habit') || ', auth.uid(), current_date)');
select tests.denied('reacting to a check-in she cannot see, using its id',
  'insert into public.reactions (check_in_id, user_id, emoji) values (' || quote_literal(:'alice_checkin') || ', auth.uid(), ''🔥'')');
select tests.denied('nudging someone she shares no group with',
  'insert into public.nudges (habit_id, from_user, to_user, nudge_day) values (' || quote_literal(:'shared_habit') || ', auth.uid(), ' || quote_literal(:'alice') || ', current_date)');
select tests.denied('ordering a habit she cannot see',
  'insert into public.habit_order (user_id, habit_id, position) values (auth.uid(), ' || quote_literal(:'shared_habit') || ', 1)');
select tests.denied('inserting a profile for someone else',
  'insert into public.profiles (id, display_name) values (gen_random_uuid(), ''ghost'')');
-- Allowed on purpose: it is how "choose a username" heals an account whose
-- profile row predates the trigger. It can only ever be your own row.
select tests.allowed('upserting her OWN profile row',
  'insert into public.profiles (id, display_name) values (auth.uid(), ''mallory'') on conflict (id) do nothing');

select tests.no_effect('renaming a group she is not in',
  'update public.groups set name = ''Owned'' where name = ''Sunrise Club''');
select tests.no_effect('deleting someone else''s check-in',
  'delete from public.check_ins where user_id <> auth.uid()');
select tests.no_effect('removing a member from a group she is not in',
  'delete from public.group_members where group_id = ' || quote_literal(:'gid'));

\echo ''
\echo '=== 2. An insider (bob) against the group he IS in ==='
select tests.as_user(:'bob');

select tests.visible('the shared habit',   'select * from public.habits where title = ''Morning run''', 1);
select tests.visible('alice''s profile',   'select * from public.profiles where username = ''alice''', 1);
select tests.invisible('alice''s PRIVATE habit',
  'select * from public.habits where title = ''Private journal''');
select tests.invisible('check-ins on a habit he cannot see',
  'select c.* from public.check_ins c join public.habits h on h.id = c.habit_id where h.title = ''Private journal''');

select tests.denied('taking ownership of the shared habit',
  'update public.habits set owner_id = auth.uid() where title = ''Morning run''');
select tests.denied('moving the shared habit into his own group',
  'update public.habits set group_id = null where title = ''Morning run''');
select tests.denied('backdating a check-in past the window',
  'insert into public.check_ins (habit_id, user_id, local_date) select id, auth.uid(), current_date - 30 from public.habits where title = ''Morning run''');
select tests.denied('editing a check-in to backdate it',
  'update public.check_ins set local_date = current_date - 30 where user_id = auth.uid()');
select tests.denied('checking in AS alice',
  'insert into public.check_ins (habit_id, user_id, local_date) values (' || quote_literal(:'shared_habit') || ', ' || quote_literal(:'alice') || ', current_date - 1)');
select tests.denied('checking in on alice''s PRIVATE habit, using its id',
  'insert into public.check_ins (habit_id, user_id, local_date) values (' || quote_literal(:'private_habit') || ', auth.uid(), current_date)');
select tests.denied('reacting as someone else',
  'insert into public.reactions (check_in_id, user_id, emoji) select id, ' || quote_literal(:'alice') || ', ''🔥'' from public.check_ins limit 1');
select tests.denied('rotating the invite code he does not own',
  'select public.rotate_invite_code(' || quote_literal(:'gid') || ')');
select tests.denied('ordering a habit for someone else',
  'insert into public.habit_order (user_id, habit_id, position) select ' || quote_literal(:'alice') || ', id, 1 from public.habits where title = ''Morning run''');
select tests.denied('changing his own id',
  'update public.profiles set id = gen_random_uuid() where id = auth.uid()');

select tests.no_effect('renaming the group he does not own',
  'update public.groups set name = ''Bob''''s Club'' where id = ' || quote_literal(:'gid'));
select tests.no_effect('deleting the shared habit (owner only)',
  'delete from public.habits where title = ''Morning run''');
select tests.no_effect('removing alice from the group',
  'delete from public.group_members where user_id = ' || quote_literal(:'alice'));
select tests.no_effect('deleting the group',
  'delete from public.groups where id = ' || quote_literal(:'gid'));

\echo ''
\echo '=== 3. What a member SHOULD be able to do ==='
select tests.allowed('check in on the shared habit',
  'insert into public.check_ins (habit_id, user_id, local_date) select id, auth.uid(), current_date from public.habits where title = ''Morning run''');
select tests.allowed('check in for yesterday (inside the window)',
  'insert into public.check_ins (habit_id, user_id, local_date) select id, auth.uid(), current_date - 1 from public.habits where title = ''Morning run''');
select tests.allowed('untick',
  'delete from public.check_ins where user_id = auth.uid() and local_date = current_date - 1');
select tests.allowed('edit the shared habit''s title',
  'update public.habits set title = ''Sunrise run'' where title = ''Morning run''');
select tests.allowed('order it for himself',
  'insert into public.habit_order (user_id, habit_id, position) select auth.uid(), id, 1 from public.habits where title = ''Sunrise run''');
select tests.allowed('react to alice''s check-in',
  'insert into public.reactions (check_in_id, user_id, emoji) select c.id, auth.uid(), ''🔥'' from public.check_ins c join public.habits h on h.id = c.habit_id where h.title = ''Sunrise run'' and c.user_id <> auth.uid() limit 1');
select tests.allowed('leave the group himself',
  'delete from public.group_members where group_id = ' || quote_literal(:'gid') || ' and user_id = auth.uid()');

\echo ''
\echo '=== 4. Signed out entirely ==='
select tests.as_user(null);
select tests.invisible('any profile',   'select * from public.profiles');
select tests.invisible('any group',     'select * from public.groups');
select tests.invisible('any habit',     'select * from public.habits');
select tests.invisible('any check-in',  'select * from public.check_ins');
select tests.denied('creating a group', 'select public.create_group(''Anon Club'')');

reset role;
\echo ''
\echo '=== every attack refused, every legitimate action allowed ==='
