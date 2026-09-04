-- ============================================================================
-- A Supabase-shaped Postgres, and the assertions the attack suite is written in
--
-- Enough of Supabase to run the real migrations unmodified: the three roles,
-- an auth schema, and an auth.uid() that reads the same request setting
-- PostgREST sets from a JWT.
-- ============================================================================

create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

create schema auth;

create table auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

create or replace function auth.uid() returns uuid
  language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to authenticated;
grant usage on schema public to anon, authenticated, service_role;

create publication supabase_realtime;

-- ---------------------------------------------------------------------------
-- Assertions
--
-- Each prints a line and raises on failure, so the run stops at the first
-- thing that is wrong rather than burying it in output.
-- ---------------------------------------------------------------------------

create schema tests;
grant usage on schema tests to authenticated;

/** Act as this person for everything that follows. */
create or replace function tests.as_user(uid uuid) returns void
  language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), false);
end $$;

/** The statement must be refused outright. */
create or replace function tests.denied(label text, stmt text) returns void
  language plpgsql as $$
declare refused boolean := false; msg text := '';
begin
  begin
    execute stmt;
  exception when others then
    refused := true; msg := sqlerrm;
  end;
  if refused then
    raise notice '  refused   %  [%]', label, left(replace(msg, E'\n', ' '), 52);
  else
    raise exception 'SECURITY FAILURE: "%" was ALLOWED and must not be', label;
  end if;
end $$;

/**
 * The statement must be allowed but touch nothing. RLS filters a row out of an
 * UPDATE or DELETE rather than raising, so "no error" is not "no effect" — the
 * difference is what tells a working policy from a missing one.
 */
create or replace function tests.no_effect(label text, stmt text) returns void
  language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  if n = 0 then
    raise notice '  no effect %', label;
  else
    raise exception 'SECURITY FAILURE: "%" changed % row(s) and must change none', label, n;
  end if;
end $$;

/** The statement must work. Catches a policy that is too strict. */
create or replace function tests.allowed(label text, stmt text) returns void
  language plpgsql as $$
begin
  execute stmt;
  raise notice '  allowed   %', label;
exception when others then
  raise exception 'REGRESSION: "%" was refused but must be allowed — %', label, sqlerrm;
end $$;

/** The query must return nothing. For "can I even see this?". */
create or replace function tests.invisible(label text, query text) returns void
  language plpgsql as $$
declare n bigint;
begin
  execute format('select count(*) from (%s) q', query) into n;
  if n = 0 then
    raise notice '  invisible %', label;
  else
    raise exception 'SECURITY FAILURE: "%" returned % row(s) and must return none', label, n;
  end if;
end $$;

/** The query must return exactly this many rows. */
create or replace function tests.visible(label text, query text, expected bigint) returns void
  language plpgsql as $$
declare n bigint;
begin
  execute format('select count(*) from (%s) q', query) into n;
  if n = expected then
    raise notice '  visible   % (% rows)', label, n;
  else
    raise exception 'FAILURE: "%" returned % row(s), expected %', label, n, expected;
  end if;
end $$;

grant execute on all functions in schema tests to authenticated;
