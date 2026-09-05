# Security

The whole app is a phone talking straight to Postgres over PostgREST. There is
no server of our own in between, so **row-level security is the entire access
control layer**. Anything RLS does not forbid, a determined user can do with
`curl` and the anon key — which ships in the app bundle and is meant to.

That is the frame for everything below: never ask "can the app do this?", ask
"can a request do this?"

## What is actually secret

| | Secret? | Why |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **No** | Grants only what RLS allows. Shipping it is the design. |
| `EXPO_PUBLIC_SUPABASE_URL` | No | A public hostname. |
| `service_role` key | **Yes** | Bypasses RLS entirely. Never in the app, never in the repo. |
| A user's refresh token | **Yes** | Effectively the account. Held in the Keychain / Keystore. |

`.env` is gitignored; `.env.example` carries no values.

## Sessions

The Supabase session is kept in **SecureStore** — the iOS Keychain and the
Android Keystore — not AsyncStorage, which is plain text in the app sandbox and
readable from a rooted or jailbroken device.

SecureStore's per-value limit is smaller than a session, so `chunked-store.ts`
splits values across numbered chunks with the count under the key. The count is
written **last**, so an interrupted write reads back as absent rather than as a
truncated session, and a missing chunk reports absence rather than half a
token. Both behaviours are tested.

Sign-in is Google OAuth over **PKCE**, with the code exchanged in the app after
an in-app browser redirect. No implicit flow, no token in a URL.

## The rules RLS enforces

- **A private habit is private.** `habits_select` requires you to own it or to
  be in its group. Nothing aggregates over private habits — not the
  leaderboard, not the feed.
- **A check-in is visible to whoever can see its habit**, and writable only as
  yourself.
- **Check-ins cannot be backdated** beyond a few days. This is what stops a
  leaderboard being won on a Sunday night, and it also bounds the damage a
  leaked LifeOS sync token could do.
- **Invite codes cannot be scraped.** There is no policy allowing a client to
  select a group by its code; lookup goes through a `SECURITY DEFINER` function
  that rate limits to 10 attempts an hour per user. Codes are 6 characters from
  a 31-letter alphabet — about 887 million — drawn from `gen_random_uuid()`
  rather than `random()`, with rejection sampling so no letter is likelier
  than another.
- **A habit cannot change hands.** `owner_id` is not in the column grant, so no
  client request can rewrite it. Only the habit's creator can move it between
  groups, enforced by a trigger, because moving a habit takes every member's
  history with it.
- **Nudges** are one per person per habit per day, only to someone you share a
  group with, and visible only to the two people involved.

All 13 `SECURITY DEFINER` functions pin `set search_path = public`. Without
that, a caller who can create objects could shadow an unqualified name and have
it run as the function's owner — the standard Postgres escalation.

## Column grants, not just policies

RLS cannot say "this column may not change": a policy sees the old row in
`USING` and the new row in `WITH CHECK`, never both together. So the columns
that must not move are held by **grant** instead:

| Table | A client may update | Deliberately not |
| --- | --- | --- |
| `habits` | title, emoji, colour, cadence, targets, reminder, order, group, archived | `id`, `owner_id`, `created_at` |
| `check_ins` | note | `habit_id`, `user_id`, `local_date` |
| `profiles` | username, display name, avatar, timezone | `id` |

## Known and accepted

- **Any group member can edit a shared habit** — rename it, change its cadence,
  archive it. That is the shared part working, not a hole. They cannot take it,
  move it, or delete it (deletion is the group owner's alone, because it would
  destroy other people's history).
- **Realtime DELETE events are not filtered by RLS.** Supabase cannot evaluate a
  policy against a row that no longer exists, so a delete broadcasts the primary
  key. A subscriber learns that some check-in id disappeared and nothing else —
  no user, no habit, no date.
- **Two moderate advisories** sit in Expo's own build tooling
  (`@expo/prebuild-config` → `decode-uri-component`, `uuid`). Neither is
  reachable from the shipped bundle, and `npm audit fix --force` downgrades
  Expo. They clear when Expo updates.
- **Group creation is not rate limited.** Worth adding if the app ever opens up
  beyond people who know each other.

## Testing the policies

`supabase/migrations/` applies cleanly to a stock Postgres 16 with the Supabase
roles and an `auth.uid()` stub. To exercise a policy as a specific person:

```sql
set role authenticated;
set request.jwt.claim.sub = '<their uuid>';
-- then run the statement you want to prove is refused
```

Do this for any new policy. A policy that has never been attacked has not been
tested.
