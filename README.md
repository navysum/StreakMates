# StreakMates

**Building better habits, together.**

A habit tracker where the streak isn't only yours. Private habits stay private; shared
habits go in front of a small group of friends who can see, react and nudge.

iOS and Android from one codebase — Expo (React Native) + TypeScript, with Supabase for
auth and data.

- **Full plan:** [`PLAN.md`](./PLAN.md) · rendered with screen mockups in [`docs/plan.html`](./docs/plan.html)
- **LifeOS sync (proposed, not built):** [`docs/lifeos-sync.md`](./docs/lifeos-sync.md)
- **Status:** Phases 0–5 complete — design system, Google sign-in, habits with check-ins
  and streaks, groups with invite codes, shared habits with a live board, the social layer
  (activity feed, reactions, leaderboard), and now habit detail with a heatmap, on-device
  reminders, an offline queue and account deletion. Phase 6 is shipping: Sign in with
  Apple, privacy policy, store listings, TestFlight.

---

## Running it on your phone

You do not need a laptop for any of this. The steps below run entirely in a browser on an
iPad plus the free **Expo Go** app on your phone.

### One-off setup

1. Install **Expo Go** from the App Store (or Play Store) on the phone you want to test on.
2. Open this repository on GitHub in Safari.
3. Press the **`.`** key, or change `github.com` to `github.dev` in the address bar — that
   opens a full editor. For running commands you want a **Codespace** instead: the green
   **Code** button → **Codespaces** → **Create codespace**. GitHub gives you 60 free hours
   a month, which is plenty.

### Every time you want to see the app

In the Codespace terminal:

```bash
npm install        # first run only
npm run tunnel     # starts the dev server with a public URL
```

`npm run tunnel` prints a QR code and an `exp://…` link. To open it:

- **Scanning from another device** — iPhone: point the Camera app at the QR code and tap
  the banner. Android: scan it from inside Expo Go.
- **Same device as the Codespace** (an iPad running both) — copy the URL from the `Metro:`
  line, paste it into a new Safari tab, and tap **Open** when it offers Expo Go.

Expo Go's own *"Development servers"* list only finds servers on your local Wi-Fi. A tunnel
is not local, so it will never appear there — open the link directly instead.

The app opens in Expo Go. Save a file in the Codespace and the phone reloads by itself.

> **Sign the CLI in first.** If the `Metro:` URL says `-anonymous-` and Expo Go is signed
> in to an account, Expo Go refuses to open the project. Run `npx expo login` in the
> Codespace, restart the tunnel, and use the new URL — it will carry your username instead
> of `anonymous`. (Signing *out* of Expo Go works too, but the CLI needs to be signed in
> for EAS builds later anyway.)
>
> The tunnel URL changes every time you restart `npm run tunnel`. Always copy the current
> `Metro:` line rather than reusing an old link.

> `--tunnel` matters: it routes through Expo's servers so your phone and the Codespace
> don't need to be on the same network. Plain `npm start` only works on one Wi-Fi.

### When Expo Go stops being enough

Expo Go can only run libraries Expo has bundled into it, and native Google Sign-In is not
one of them. The plan uses Supabase's browser-based login until **Phase 4**, so Expo Go
carries you through Phases 0–3 for free. Phase 4 is where a development build (and the
$99/year Apple Developer account) becomes worth paying for. See
[section 11 of the plan](./PLAN.md#11-working-without-a-laptop).

---

## What's built

| | |
| --- | --- |
| `supabase/migrations/` | `0001` tables and policies; `0002` live updates; `0003` usernames; `0004` reactions and nudges; `0005` account deletion; `0006` per-person habit order. See [`supabase/README.md`](./supabase/README.md) |
| `app/_layout.tsx` | Fonts, splash, theme, data cache, and the redirect to sign-in when signed out |
| `app/sign-in.tsx` | Continue with Google — doubles as the setup notice until Supabase is connected |
| `app/(tabs)/` | Today (Mine / Shared), Groups, Activity, You |
| `src/lib/leaderboard.ts` | Consistency, group streak, perfect days, habit rates — pure, tested |
| `app/habit/` | A habit's detail — streak, heatmap, notes — plus create and edit |
| `app/manage.tsx` | Reorder, archive and restore in one place |
| `app/group/` | Create a group, join by code, and the group screen: today's board, shared habits, members, invite code |
| `src/lib/streak.ts` | Streak and weekly-progress maths — pure functions, covered by `npm test` |
| `src/lib/identity.ts` | How a person is named where others can see them — the handle wins over the display name |
| `src/lib/reminders.ts` | On-device reminder scheduling; the decisions are in `reminders-pure.ts` and tested |
| `src/lib/outbox.ts` | Check-ins that have not reached the server yet |
| `src/lib/ordering.ts` | How your habit lists are arranged — yours alone, per list |
| `src/lib/queries.ts` | Every read and write, with optimistic check-ins |
| `src/theme/` | Design tokens, and the theme provider with System / Light / Dark, remembered between launches |
| `assets/fonts/` | Barlow and Barlow Condensed, static instances + the OFL licence |

Before Supabase is connected the app still runs: the sign-in screen shows what to
set up instead of a Google button.

### How shared habits work

A shared habit is **one** row with a `group_id`, and every member checks in against
that same row. Nothing is copied per person — the `(habit, user, date)` key on
`check_ins` does all the work.

So the board is just a question: for today's date, who has a row and who hasn't. The
empty amber rings are the point. It updates live over Supabase Realtime as people
check in, and row-level security applies to those events too, so nothing arrives that
the viewer could not already read.

Making a private habit shared asks first — that can't be un-seen.

### How the leaderboard counts

**Consistency, not volume:** completed ÷ what was *owed* of you. Tracking more
habits is not an advantage, and joining a group late is not a penalty — nothing is
expected of you before you joined, before a habit existed, or after it was
archived. Someone owed nothing scores `—`, not 0% and not 100%.

**Only shared habits count.** A private habit feeding a group percentage would
leak it: watch a score move on a day someone logged nothing shared, and you have
learned something they chose not to show you.

The collective numbers sit above the ranking on purpose — a group streak is
something to win together before the part where you beat each other.

### How check-ins work

Tapping the circle writes locally first, so the tick is instant, then saves. The
day is worked out **on the device** from your timezone and sent as a plain date —
never derived from a timestamp on the server, or someone checking in at 11pm in
Sydney lands on the wrong day.

Streaks are computed on read from the check-in rows, never stored, so a check-in
that arrives late can't leave a counter wrong.

If the save fails — no signal, a tunnel, the app closed — the intent goes to an
**outbox** on disk and is replayed next launch. Replaying is safe because
`check_ins` is unique on `(habit, user, date)`: a write that lands twice does
nothing the second time. Entries older than three days are dropped rather than
retried forever, because the insert policy would reject them anyway.

### Reminders are on the device

`remind me at 07:00` needs no server, no push token and no development build, so
reminders are scheduled locally with `expo-notifications` and kept in step with
the habits on every launch. Server push is only needed for things the server
knows first — a friend checking in — which is a later problem.

### On the web

The same codebase also exports a static site — `npm run build:web` — which is
deployed to Vercel. Reminders are the one feature that cannot follow it there,
and the web build says so rather than accepting a time no browser can honour.
**[`docs/web.md`](./docs/web.md)** covers deploying, the two OAuth allowlists
that sign-in needs, and what differs between the phone and the browser.

### The design system

The app is drawn in **Industry**, a blueprint language: a light technical ground, one
accent, square corners, hairline borders, condensed uppercase labels, and `+` registration
marks at the corners of framed objects. Its steel-blue accent and grey ground are replaced
by StreakMates' green on cream; nothing else about the system changed.

Two rules drive nearly every decision in `src/theme/tokens.ts`, and both are easy to break
by accident:

- **Cards are line drawings, not filled surfaces.** A 1px divider border, no fill, no
  shadow, no radius. The one solid object on a screen is the primary button. This is what
  `Plate` is; there is no `Card`.
- **There is only one accent.** No amber, no red, no per-member colour. Rank, tone and
  emphasis come from steps of the accent ramp and from tag variants — which is why first
  place is not gold and "needs work" is not red.

The organising idea is a **7-cell week strip**, Monday→Sunday, repeated at four sizes:
under each habit row on Today, as a member × day matrix on the group board, as a 12-week
grid on habit detail, and as an 18-week intensity grid on You. You learn to read it once.

The system is non-pictorial, so habit and group emoji are gone and reactions are word tags
(`CLAP`, `FIRE`, `NICE`) rather than emoji. The database columns are untouched — old rows
keep their emoji, nothing writes a new one, and nothing renders them.

### About the fonts

Barlow Condensed carries everything structural — titles, micro-labels, every figure.
Barlow carries prose and row names. Figures are condensed with `fontVariant:
['tabular-nums']` rather than a separate mono face, which is why there is no mono font any
more. React Native doesn't handle variable font weights reliably, so these are static
instances, one file per weight:

`BarlowCondensed-SemiBold`, `Barlow-Regular`, `Barlow-SemiBold`.

---

## Supabase

Follow **[`supabase/README.md`](./supabase/README.md)** — it walks through creating the
project, running the migration, wiring up Google sign-in and filling in `.env`, all from a
browser. About twenty minutes, once.

---

## Scripts

```bash
npm run tunnel      # dev server reachable from anywhere (use this one)
npm start           # dev server, same network only
npm run typecheck   # tsc --noEmit
npm test            # streak and date logic
npm run web         # run in a browser
```
