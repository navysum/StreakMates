-- ============================================================================
-- Shared tasks
--
-- Two kinds, and the difference is the whole point:
--
--   once      one person does it and it is done for everyone
--   everyone  each person does their own
--
-- Alice and bob share Sunrise Club. Mallory is in neither, and is here to
-- prove that "shared with a group" still means "not shared with the world".
-- ============================================================================

\set QUIET on
\set ON_ERROR_STOP on

\set alice   aaaaaaaa-0000-0000-0000-000000000001
\set bob     bbbbbbbb-0000-0000-0000-000000000002
\set mallory cccccccc-0000-0000-0000-000000000003

set role authenticated;
select tests.as_user(:'alice');
select id as gid, invite_code as code from public.groups where name = 'Sunrise Club' limit 1 \gset

-- Bob left the group at the end of 01_rls.sql; he is back for this.
select tests.as_user(:'bob');
select 1 from public.join_group_with_code(:'code');

select tests.as_user(:'alice');
insert into public.tasks (user_id, group_id, title, completion, position)
  values (auth.uid(), :'gid', 'Book the restaurant', 'once', 0),
         (auth.uid(), :'gid', 'Submit your expenses', 'everyone', 1);
select id as once_task from public.tasks where title = 'Book the restaurant' \gset
select id as each_task from public.tasks where title = 'Submit your expenses' \gset

\echo ''
\echo '=== 14. A shared task is the group''s, and only the group''s ==='
select tests.as_user(:'bob');
select tests.visible('bob sees both shared tasks',
  'select * from public.tasks where group_id = ' || quote_literal(:'gid'), 2);

select tests.as_user(:'mallory');
select tests.invisible('an outsider sees neither',
  'select * from public.tasks where group_id = ' || quote_literal(:'gid'));
select tests.denied('an outsider cannot tick one off, even with its id',
  'insert into public.task_completions (task_id, user_id) values (' || quote_literal(:'once_task') || ', auth.uid())');
select tests.denied('nor add a task to someone else''s group',
  'insert into public.tasks (user_id, group_id, title, position) values (auth.uid(), ' || quote_literal(:'gid') || ', ''intruding'', 0)');
select tests.no_effect('nor rename one',
  'update public.tasks set title = ''hijacked'' where id = ' || quote_literal(:'once_task'));

\echo ''
\echo '=== 15. "One of us" — anyone does it, anyone can undo it ==='
select tests.as_user(:'bob');
select tests.allowed('bob books the restaurant',
  'insert into public.task_completions (task_id, user_id) values (' || quote_literal(:'once_task') || ', auth.uid())');

select tests.as_user(:'alice');
select tests.visible('alice can see that it is booked, and by whom',
  'select * from public.task_completions where task_id = ' || quote_literal(:'once_task'), 1);
select tests.allowed('alice can put it back, though bob ticked it',
  'delete from public.task_completions where task_id = ' || quote_literal(:'once_task'));

\echo ''
\echo '=== 16. "Each of us" — your tick is yours alone ==='
select tests.as_user(:'alice');
select tests.allowed('alice submits hers',
  'insert into public.task_completions (task_id, user_id) values (' || quote_literal(:'each_task') || ', auth.uid())');

select tests.as_user(:'bob');
select tests.visible('bob can see alice has, which is the point',
  'select * from public.task_completions where task_id = ' || quote_literal(:'each_task'), 1);
select tests.no_effect('but cannot undo hers',
  'delete from public.task_completions where task_id = ' || quote_literal(:'each_task') || ' and user_id = ' || quote_literal(:'alice'));
select tests.denied('nor tick it off in her name',
  'insert into public.task_completions (task_id, user_id) values (' || quote_literal(:'each_task') || ', ' || quote_literal(:'alice') || ')');
select tests.allowed('and ticks off his own',
  'insert into public.task_completions (task_id, user_id) values (' || quote_literal(:'each_task') || ', auth.uid())');

\echo ''
\echo '=== 17. A member may edit a shared task, but not take or move it ==='
select tests.allowed('bob renames it',
  'update public.tasks set title = ''Submit expenses by Friday'' where id = ' || quote_literal(:'each_task'));
select tests.allowed('bob reorders it',
  'update public.tasks set position = 5 where id = ' || quote_literal(:'each_task'));
select tests.allowed('bob deletes a shared task',
  'delete from public.tasks where id = ' || quote_literal(:'each_task'));

select tests.denied('but cannot make it his own',
  'update public.tasks set user_id = auth.uid() where id = ' || quote_literal(:'once_task'));
select tests.denied('nor pull it out of the group',
  'update public.tasks set group_id = null where id = ' || quote_literal(:'once_task'));

select tests.as_user(:'alice');
select tests.allowed('the person who added it can move it',
  'update public.tasks set group_id = null where id = ' || quote_literal(:'once_task'));

\echo ''
\echo '=== 18. A completion is either there or it is not ==='
select tests.denied('editing a completion after the fact',
  'update public.task_completions set done_at = now() - interval ''30 days''');

reset role;
\echo ''
\echo '=== shared tasks are the group''s; ticks belong to whoever made them ==='
