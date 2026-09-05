-- ============================================================================
-- Tasks and focus sessions
--
-- These are private in a way nothing else in the app is: not "visible to your
-- group", but visible to nobody at all. Alice and bob share a group, which is
-- what makes them the right pair to prove it with — if sharing a group leaked
-- a task, it would leak here.
-- ============================================================================

\set QUIET on
\set ON_ERROR_STOP on

\set alice aaaaaaaa-0000-0000-0000-000000000001
\set bob   bbbbbbbb-0000-0000-0000-000000000002

set role authenticated;

select tests.as_user(:'alice');
insert into public.tasks (user_id, title, position) values (auth.uid(), 'Email the landlord', 0);
select id as alice_task from public.tasks where title = 'Email the landlord' \gset
insert into public.focus_sessions (user_id, task_id, started_at, minutes)
  values (auth.uid(), :'alice_task', now() - interval '30 minutes', 25);
select id as alice_session from public.focus_sessions where user_id = auth.uid() \gset

\echo ''
\echo '=== 11. A task is private even from someone in your group ==='
select tests.as_user(:'bob');

select tests.invisible('alice''s task',           'select * from public.tasks');
select tests.invisible('alice''s focus sessions', 'select * from public.focus_sessions');

select tests.denied('adding a task to alice''s list',
  'insert into public.tasks (user_id, title, position) values (' || quote_literal(:'alice') || ', ''sabotage'', 0)');
select tests.denied('recording focus as alice',
  'insert into public.focus_sessions (user_id, started_at, minutes) values (' || quote_literal(:'alice') || ', now(), 25)');
select tests.denied('taking over a task, using its id',
  'update public.tasks set user_id = auth.uid() where id = ' || quote_literal(:'alice_task'));

select tests.denied('ticking off alice''s private task',
  'insert into public.task_completions (task_id, user_id) values (' || quote_literal(:'alice_task') || ', auth.uid())');
select tests.no_effect('deleting alice''s task',
  'delete from public.tasks where id = ' || quote_literal(:'alice_task'));
select tests.no_effect('deleting alice''s focus session',
  'delete from public.focus_sessions where id = ' || quote_literal(:'alice_session'));

\echo ''
\echo '=== 12. Your own list works ==='
select tests.allowed('adding a task',
  'insert into public.tasks (user_id, title, position) values (auth.uid(), ''Book the dentist'', 0)');
select tests.allowed('ticking it off',
  'insert into public.task_completions (task_id, user_id) select id, auth.uid() from public.tasks where user_id = auth.uid()');
select tests.allowed('un-ticking it',
  'delete from public.task_completions where user_id = auth.uid()');
select tests.allowed('renaming it',
  'update public.tasks set title = ''Book the dentist, properly'' where user_id = auth.uid()');
select tests.allowed('reordering it',
  'update public.tasks set position = 3 where user_id = auth.uid()');
select tests.allowed('recording a stretch of focus',
  'insert into public.focus_sessions (user_id, started_at, minutes) values (auth.uid(), now() - interval ''25 minutes'', 25)');
select tests.allowed('deleting your own task',
  'delete from public.tasks where user_id = auth.uid()');

\echo ''
\echo '=== 13. A session is a fact about the past ==='
select tests.denied('backdating focus to last month',
  'insert into public.focus_sessions (user_id, started_at, minutes) values (auth.uid(), now() - interval ''30 days'', 240)');
select tests.denied('claiming focus from tomorrow',
  'insert into public.focus_sessions (user_id, started_at, minutes) values (auth.uid(), now() + interval ''2 days'', 25)');
select tests.denied('a day-long stretch of focus',
  'insert into public.focus_sessions (user_id, started_at, minutes) values (auth.uid(), now(), 600)');
select tests.denied('editing a session after the fact',
  'update public.focus_sessions set minutes = 240 where user_id = auth.uid()');
select tests.denied('an empty task title',
  'insert into public.tasks (user_id, title, position) values (auth.uid(), ''   '', 0)');

reset role;
\echo ''
\echo '=== tasks stay private, and focus cannot be invented ==='
