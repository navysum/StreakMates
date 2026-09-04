-- ============================================================================
-- Choosing a username, including from the state that used to lock people out
-- ============================================================================

\set QUIET on
\set ON_ERROR_STOP on

set role postgres;

-- An account with no profile row: what someone who signed up before 0001 was
-- run actually looks like. The trigger is dropped for the insert so the row is
-- genuinely absent rather than merely blank.
alter table auth.users disable trigger on_auth_user_created;
insert into auth.users (id, email) values ('99999999-0000-0000-0000-000000000099', 'orphan@example.com');
alter table auth.users enable trigger on_auth_user_created;

\set orphan 99999999-0000-0000-0000-000000000099
set role authenticated;
select tests.as_user(:'orphan');

\echo ''
\echo '=== 9. An account whose profile row never existed ==='
select tests.invisible('it really has no profile row',
  'select * from public.profiles where id = ' || quote_literal(:'orphan'));

select tests.allowed('claiming a username anyway', 'select public.set_username(''orphan'')');
select tests.visible('the profile row now exists',
  'select * from public.profiles where id = ' || quote_literal(:'orphan'), 1);
select tests.visible('with the username actually set',
  'select * from public.profiles where id = ' || quote_literal(:'orphan') || ' and username = ''orphan''', 1);

\echo ''
\echo '=== 10. The ordinary case, and the rules around it ==='
select tests.allowed('changing your username again', 'select public.set_username(''orphan2'')');
select tests.denied('taking a username someone already has', 'select public.set_username(''alice'')');
select tests.denied('a username that breaks the format rule', 'select public.set_username(''1nope'')');
select tests.denied('a username that is too short', 'select public.set_username(''ab'')');

select tests.as_user(null);
select tests.denied('setting a username while signed out', 'select public.set_username(''nobody'')');

-- The identity column stays shut, which is why the function exists at all.
select tests.as_user(:'orphan');
select tests.denied('moving your row to another id', 'update public.profiles set id = gen_random_uuid() where id = auth.uid()');
select tests.denied('creating a profile row directly',
  'insert into public.profiles (id, display_name) values (gen_random_uuid(), ''x'')');

reset role;
\echo ''
\echo '=== usernames work from every state, and identity stays shut ==='
