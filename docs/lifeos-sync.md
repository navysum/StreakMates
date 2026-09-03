# Syncing habits with LifeOS

A design for keeping habit check-ins in step between this app and the LifeOS
portal, so ticking a habit in either place ticks it in the other.

**Status:** proposed. Nothing here is built.

---

## 1. What LifeOS actually stores

Worth knowing before anything else, because it rules some designs out.

LifeOS habits are **not in a database**. They are Markdown in an Obsidian vault:
one file per day at `02 Habits/Habit Logs/<year>/<YYYY-MM-DD>.md`, with YAML
frontmatter booleans and matching checkbox lines in the body. Eight canonical
keys — `sleep_early`, `no_junk_food`, `phone_off_10pm`, `prayer_bible`,
`water_intake`, `study_revision`, `exercise`, `journal` — plus a dynamic
registry for habits added later.

The portal already exposes an HTTP API over that vault:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/app/api/habits?days=N` | Recent state |
| `GET` | `/api/v1/lifeos/habits/registry` | The habit list |
| `PATCH` | `/api/v1/lifeos/habits/<date>/<key>` | Toggle, `{"done": bool}` |

And one comment in `server.py` decides the whole architecture:

> `# tailnet is the security boundary, same as every route`

The VPS sits on a private tailnet, not the public internet. **Supabase cannot
call in.** No webhooks, no push. Every sync has to be started from the VPS.

That is a constraint, but a welcome one — see §5.

## 2. Why not git

The proposal was a repo the VPS pushes to every 15 minutes.

- **The app doesn't read git.** It reads Supabase. Git would need a *second*
  job to read the repo and write Supabase — a hop added, not removed.
- **Git is the worst possible conflict surface for a boolean.** Two systems
  editing the same file gives merge conflicts over one bit.
- **A commit per check-in** turns a habit log into a noisy history.
- **Fifteen minutes of lag** for none of the above being better.

Keep git for backing up the vault. It is not the bus.

## 3. The shape

A small worker on the VPS, on a systemd timer, every ~5 minutes:

```
   ┌──────────────── VPS (tailnet) ────────────────┐
   │                                                │
   │  Obsidian vault ──► LifeOS HTTP API            │
   │                        ▲   │                   │
   │                        │   ▼                   │
   │                     sync worker                │
   │                        │                       │
   └────────────────────────┼───────────────────────┘
                            │  outbound HTTPS only
                            ▼
                       Supabase  ◄──── the phone app
```

It talks to LifeOS over **localhost**, so LifeOS still owns and validates every
vault write — the worker cannot corrupt the vault in ways the portal's own code
would not. It talks to Supabase over PostgREST.

**Nothing ever connects to the VPS.** Not Supabase, not the app, not a webhook.

## 4. Privacy — what syncs, and what cannot

Three different things get called "private". They are separate, and the sync
only touches the second one.

### Private *within the app* is untouched

A habit with no `group_id` is invisible to every other user, enforced by
row-level security in Postgres. Syncing writes ordinary `check_ins` rows; it
changes nothing about who can read them. **A private habit stays private
whether it syncs or not.**

### Nothing syncs unless you link it

The two systems have different habit sets, so syncing is **opt-in per habit**
through an explicit mapping. The default is that a habit does not sync at all.
Create a habit in the app and it never touches the vault unless you say so.

Each link also carries a direction, because "keep them the same" is not always
what you want:

| Direction | Meaning |
| --- | --- |
| `both` | Tick in either place, both update |
| `to-lifeos` | The app writes to the vault; the vault never writes back |
| `from-lifeos` | The vault writes to the app; the app never writes back |

### Only one bit crosses, and only ever yours

Two properties worth being explicit about:

- **Only the boolean syncs. Notes never do.** `check_ins.note` is free text and
  could contain anything; it stays where it was written.
- **Only your own check-ins sync.** The app's policy already restricts writes to
  `user_id = auth.uid()`, so a friend cannot create a check-in as you. Linking a
  *shared* habit therefore cannot let anyone else write into your vault. The
  traffic is one bit, per linked habit, per day, in your own name.

Linking a shared habit is genuinely useful — tick "gym session" at your desk in
LifeOS and the group board updates — and it stays safe for exactly that reason.

## 5. Security — what connection this creates

The honest version.

### No inbound path is opened

The worker makes **outbound HTTPS only**. Supabase is never told the VPS exists
— no address, no hostname, no callback URL stored anywhere on its side. The
tailnet boundary is exactly where it was. Compromising the app, or Supabase, or
a friend's account, yields nothing that points at your box.

This is the main reason to prefer VPS-initiated polling over webhooks even if
webhooks were possible.

### The credential is the whole risk, so make it a small one

The worker needs to write to Supabase as you. There are two ways, and the
difference matters:

| | Blast radius if the VPS is compromised |
| --- | --- |
| **Service-role key** ❌ | Bypasses row-level security entirely. Full read/write over **every** user's rows in the project. |
| **Your own refresh token** ✅ | Acts as you, under the same policies as your phone. Reaches **only your own** rows. |

**Use a refresh token, not the service-role key.** Sign in once, store the
refresh token in the systemd unit's environment, let the client refresh access
tokens from it. The service-role key should never leave Supabase's dashboard.

A stolen token then means someone can tick and untick *your* habits. That is the
worst case, and it is proportionate to what is being moved: booleans and dates.
No credentials, no messages, no location.

### The existing backfill guard limits it further

`check_ins`'s insert policy already bounds `local_date` to within three days of
today. That was written to stop a leaderboard being won by backfilling a month
on a Sunday night — but it applies to the sync token too. **A compromised sync
token cannot rewrite history**, only the last few days.

This is why the write window below is three days rather than seven.

### Turning it off

`systemctl disable --now lifeos-habit-sync.timer` stops it dead. Revoking access
is signing that session out in Supabase. Neither needs an app release.

## 6. The hard part — three-way merge

The obvious rule is "checked in either place → checked in both". **That rule
means you can never uncheck anything.** Untick in the app, and the next run sees
LifeOS still ticked and puts it back. Forever.

The fix is to remember what was last synced, so "A changed" can be told apart
from "B hasn't caught up". For each (habit, date):

| Last synced | LifeOS now | App now | Action |
| --- | --- | --- | --- |
| ✅ | ✅ | ✅ | nothing |
| ✅ | ❌ | ✅ | LifeOS changed → untick in app |
| ✅ | ✅ | ❌ | app changed → untick in LifeOS |
| ❌ | ✅ | ❌ | LifeOS changed → tick in app |
| ❌ | ❌ | ✅ | app changed → tick in LifeOS |
| ✅ | ❌ | ❌ | both unticked → nothing |
| — | ✅ | ❌ | both changed, disagree → **ticked wins**, and log it |

"Ticked wins" is the humane default: you did the thing, and the failure mode of
guessing wrong is a habit marked done that wasn't, not a lost streak.

State lives in a small JSON file on the VPS. Losing it is not fatal — the worker
falls back to union for one cycle and rebuilds, which can resurrect a very
recent untick. Back it up with the vault.

## 7. Days, and whose day it is

LifeOS calls `date.today()` — the **server's** clock. The app computes the date
on the **device**, from the user's timezone. If the VPS runs UTC and you tick
something at 00:30 in British Summer Time, the two disagree about which day it
belongs to.

The app already stores `profiles.timezone` on sign-in. The worker should read it
and use that for "today", never the server clock.

## 8. Windows

- **Read** the last **7 days** from both sides — enough to notice a late change.
- **Write** only within **3 days** of today, matching the insert policy exactly.

Days 4–7 are compared and logged but not written. If they ever disagree, that is
a bug worth seeing, not something to paper over.

## 9. The mapping

Start as a file on the VPS. No schema change, no UI, and it is a single-user
bridge:

```yaml
# /etc/lifeos/habit-sync.yml
user_id: "<supabase auth user id>"
timezone_from_profile: true
links:
  - lifeos: exercise
    app_habit: "e6f1…"        # habits.id
    direction: both
  - lifeos: phone_off_10pm
    app_habit: "9c02…"
    direction: from-lifeos
```

**Upgrade path:** move this to a `habit_links` table in Supabase when you want
to link habits from inside the app and show a "synced" badge on a habit. The
worker reads the table instead of the file; nothing else changes.

## 10. What gets built

In `navysum/life-os-portal`, since it needs to live beside the vault:

| | |
| --- | --- |
| `lifeos/habit_sync/client.py` | Thin Supabase PostgREST client, token refresh |
| `lifeos/habit_sync/merge.py` | The three-way merge — pure functions, unit tested |
| `lifeos/habit_sync/run.py` | One cycle: read both, merge, apply, save state |
| `systemd/lifeos-habit-sync.{service,timer}` | Every 5 minutes |
| `tests/test_habit_sync_merge.py` | Every row of the table in §6 |

Nothing changes in this app for the first version. That is the point — the
bridge is one-directional in its dependencies, so it can be deleted without
touching either side.

## 11. Before building

- **Push access to `life-os-portal`.** Currently read-only in these sessions.
- **It cannot be verified from here.** The tailnet means the VPS is unreachable
  from a development session, so the merge logic gets unit tests and you run the
  integration.
- **Decide the first link.** One habit, `from-lifeos`, for a few days is a safer
  first run than eight habits bidirectional.
