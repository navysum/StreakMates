-- ============================================================================
-- Ceilings and rate limits
--
-- Two things to prove of every limit: that it stops abuse, and that it is
-- nowhere near what a real person does. A limit that fires in normal use is a
-- bug wearing a security badge.
-- ============================================================================

\set QUIET on
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('dddddddd-0000-0000-0000-000000000004', 'dana@example.com'),
  ('eeeeeeee-0000-0000-0000-000000000005', 'eve@example.com');

\set dana dddddddd-0000-0000-0000-000000000004
\set eve  eeeeeeee-0000-0000-0000-000000000005

set role authenticated;

\echo ''
\echo '=== 5. Guessing invite codes ==='
select tests.as_user(:'eve');

-- Ten wrong guesses are spent, then the door shuts. Previewing and joining
-- share the budget deliberately: both reveal whether a code exists.
do $$
declare i int;
begin
  for i in 1 .. 10 loop
    begin
      perform public.preview_group_by_code('ZZZZZ' || i::text);
    exception when others then null;  -- "no such group" is expected
    end;
  end loop;
end $$;

select tests.denied('an eleventh code guess within the hour',
  'select public.preview_group_by_code(''QQQQQQ'')');
select tests.denied('switching to join once previews are spent',
  'select public.join_group_with_code(''QQQQQQ'')');

\echo ''
\echo '=== 6. Creating groups ==='
select tests.as_user(:'dana');

select tests.allowed('a first group',  'select public.create_group(''One'')');
select tests.allowed('a second group', 'select public.create_group(''Two'')');
select tests.allowed('a third group',  'select public.create_group(''Three'')');

do $$
declare i int;
begin
  for i in 4 .. 10 loop
    perform public.create_group('Filler ' || i::text);
  end loop;
end $$;

select tests.denied('an eleventh group within the hour',
  'select public.create_group(''Too many'')');

\echo ''
\echo '=== 7. Creating habits ==='
-- Well inside the ceiling: more than anyone really has, still allowed.
do $$
declare i int;
begin
  for i in 1 .. 40 loop
    insert into public.habits (owner_id, title) values (auth.uid(), 'Habit ' || i::text);
  end loop;
end $$;
select tests.visible('forty habits, which is already unusual', 'select 1 from public.habits where owner_id = auth.uid()', 40);

do $$
declare i int;
begin
  for i in 41 .. 60 loop
    insert into public.habits (owner_id, title) values (auth.uid(), 'Habit ' || i::text);
  end loop;
end $$;

select tests.denied('a sixty-first habit within the hour',
  'insert into public.habits (owner_id, title) values (auth.uid(), ''Too many'')');

\echo ''
\echo '=== 8. One person''s ceiling is not another''s ==='
select tests.as_user(:'eve');
select tests.allowed('eve can still create a group after dana hit her limit',
  'select public.create_group(''Eve''''s own'')');
select tests.allowed('and still create a habit',
  'insert into public.habits (owner_id, title) values (auth.uid(), ''Eve''''s habit'')');

reset role;
\echo ''
\echo '=== limits hold, and hold per person ==='
