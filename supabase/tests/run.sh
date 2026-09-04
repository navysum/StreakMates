#!/usr/bin/env bash
# Stand up a throwaway Postgres, apply every migration, and attack the policies.
#
#   ./supabase/tests/run.sh
#
# Needs a local postgres (apt install postgresql, or brew install postgresql).
# Touches nothing outside its own temporary directory, and never talks to your
# real Supabase project.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${PGPORT_TEST:-55999}"
DATA="$(mktemp -d)"
SOCK="$(mktemp -d)"

for d in /usr/lib/postgresql/*/bin /opt/homebrew/opt/postgresql*/bin /usr/local/opt/postgresql*/bin; do
  [ -d "$d" ] && PATH="$PATH:$d"
done
command -v initdb >/dev/null || { echo "postgres not found — install it first"; exit 1; }

cleanup() {
  pg_ctl -D "$DATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$DATA" "$SOCK"
}
trap cleanup EXIT

initdb -D "$DATA" -U postgres --auth=trust >/dev/null
pg_ctl -D "$DATA" -o "-p $PORT -k $SOCK -c listen_addresses=''" -l "$DATA/log" start >/dev/null

psql() { command psql -h "$SOCK" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 "$@"; }

psql -q -c 'create database streakmates' postgres
DB=(-d streakmates -q)

echo "--- harness"
psql "${DB[@]}" -f "$ROOT/supabase/tests/00_harness.sql"

echo "--- migrations"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "    $(basename "$f")"
  psql "${DB[@]}" -f "$f"
  # Supabase grants every table to the API roles as tables are created, so
  # mirror that between files. 0007's revokes then land last, as they do live.
  psql "${DB[@]}" -c 'grant all on all tables in schema public to anon, authenticated, service_role' >/dev/null
done
psql "${DB[@]}" -f "$ROOT/supabase/migrations/0007_hardening.sql"

echo "--- attacking"
for t in "$ROOT"/supabase/tests/0[1-9]_*.sql; do
  psql "${DB[@]}" -f "$t"
done
