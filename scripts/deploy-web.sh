#!/usr/bin/env bash
#
# Deploy StreakMates to Vercel, from your machine.
#
#   ./scripts/deploy-web.sh
#
# Reads the two values out of your existing .env and pushes them to Vercel, so
# there is no copying into a dashboard and nothing to mistype. Your Vercel
# credentials stay on this computer: the script only ever runs the official CLI,
# which stores its token in ~/.vercel.
#
# Safe to run again. Re-running redeploys and refreshes the variables.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$*"; }
info() { printf '    %s\n' "$*"; }

# ---------------------------------------------------------------- 1. the env

say "1. Reading .env"

if [ ! -f .env ]; then
  bad "No .env in $(pwd)"
  info "Copy .env.example to .env and fill in your Supabase URL and anon key."
  exit 1
fi

# Only the two keys we want, and only from lines that look like assignments —
# so a stray comment or a quoted value with an = in it cannot smuggle anything
# through. `set -a` would export the whole file; this does not.
read_env() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- | tr -d '"'"'"' \r'; }

SUPABASE_URL="$(read_env EXPO_PUBLIC_SUPABASE_URL || true)"
SUPABASE_KEY="$(read_env EXPO_PUBLIC_SUPABASE_ANON_KEY || true)"

# The same two checks src/lib/supabase.ts makes at runtime, made here instead —
# a typo caught now is a minute, caught after deploying is a confusing hour.
if ! printf '%s' "$SUPABASE_URL" | grep -qE '^https://[a-z0-9-]+\.supabase\.(co|in)$'; then
  bad "EXPO_PUBLIC_SUPABASE_URL does not look right: '${SUPABASE_URL:-<empty>}'"
  info "It should be the API address — https://<project-ref>.supabase.co —"
  info "not the dashboard address you see in the browser."
  exit 1
fi
ok "URL  $SUPABASE_URL"

if ! printf '%s' "$SUPABASE_KEY" | grep -q '^eyJ'; then
  bad "EXPO_PUBLIC_SUPABASE_ANON_KEY does not look like a Supabase key"
  info "It is a long string beginning 'eyJ'. Use the anon key, never the"
  info "service_role key — that one bypasses row-level security entirely."
  exit 1
fi
ok "Key  ${SUPABASE_KEY:0:12}… (${#SUPABASE_KEY} chars)"

# A service_role key would be catastrophic in a public bundle, and the two look
# alike at a glance. The role is in the JWT payload, so it can be checked.
PAYLOAD="$(printf '%s' "$SUPABASE_KEY" | cut -d. -f2)"
case $(( ${#PAYLOAD} % 4 )) in 2) PAYLOAD="$PAYLOAD==" ;; 3) PAYLOAD="$PAYLOAD=" ;; esac
if printf '%s' "$PAYLOAD" | tr '_-' '/+' | base64 -d 2>/dev/null | grep -q 'service_role'; then
  bad "That is the service_role key, not the anon key."
  info "It bypasses row-level security and would be readable by anyone who"
  info "opened the site. Take the anon key from the same Supabase page."
  exit 1
fi
ok "It is an anon key, not service_role"

# ---------------------------------------------------------- 2. build locally

say "2. Building the site"
info "Doing this here first means a build error shows up now, with readable"
info "output, rather than in a deployment log."
npm run build:web >/dev/null
ok "dist/ built"

# ------------------------------------------------------------- 3. to Vercel

say "3. Deploying"
info "The CLI will ask you to log in the first time, and to confirm the project"
info "name. Accept the defaults — vercel.json already sets the build and the"
info "routing, so 'Other' is the right framework."
echo

npx --yes vercel@latest link

for TARGET in production preview development; do
  # `vercel env add` refuses when the name already exists, which is the normal
  # case on a re-run, so the old value is removed first. Both are quiet about
  # doing nothing, hence the || true.
  npx --yes vercel@latest env rm EXPO_PUBLIC_SUPABASE_URL "$TARGET" --yes >/dev/null 2>&1 || true
  npx --yes vercel@latest env rm EXPO_PUBLIC_SUPABASE_ANON_KEY "$TARGET" --yes >/dev/null 2>&1 || true
  printf '%s' "$SUPABASE_URL" | npx --yes vercel@latest env add EXPO_PUBLIC_SUPABASE_URL "$TARGET" >/dev/null
  printf '%s' "$SUPABASE_KEY" | npx --yes vercel@latest env add EXPO_PUBLIC_SUPABASE_ANON_KEY "$TARGET" >/dev/null
  ok "variables set for $TARGET"
done

echo
URL="$(npx --yes vercel@latest --prod 2>&1 | tee /dev/tty | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | tail -1)"

# ------------------------------------------------------------ 4. what is left

say "4. Two things only you can do"
echo
echo "  Sign-in will fail until the deployed address is on both allowlists."
echo "  Google refuses to redirect anywhere it has not been told about."
echo
echo "  Your address:  ${URL:-<see the deployment output above>}"
echo
echo "  a) Supabase → Authentication → URL Configuration"
echo "       Site URL:       ${URL:-<your URL>}"
echo "       Redirect URLs:  ${URL:-<your URL>}/**"
echo "       Keep the existing exp:// and streakmates:// entries — those are"
echo "       the phone apps, and removing them breaks Expo Go."
echo
echo "  b) Google Cloud console → the OAuth client Supabase uses"
echo "       Authorised JavaScript origins:  ${URL:-<your URL>}"
echo "       Leave the redirect URI alone. It stays Supabase's own callback:"
echo "       Google always returns to Supabase, which then returns to the app."
echo
echo "  Then open the site and sign in. If it bounces back signed out, one of"
echo "  those two is missing or has a trailing slash."
echo
