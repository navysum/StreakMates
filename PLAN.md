# Habits With Friends — Plan v1

A habit tracker where you keep private habits to yourself and put shared habits in
front of a small group of friends who can see, react and nudge.

A rendered version of this plan (with screen mockups) lives in `docs/plan.html`.

The app borrows its **look only** from `navysum/life-os-portal` (section 2). It is otherwise a
completely separate product: separate codebase, database, account and data.

## 1. The core idea

- A **private habit** is a row in `habits` owned by you, with `group_id` null.
- A **shared habit** is *one* row owned by a group. Every member checks in against
  that same row.
- Nothing is duplicated per person. A `check_ins` table keyed by
  `(habit_id, user_id, local_date)` does all the work.

The group board is simply: for today's date, who has a check-in row and who doesn't.

## 2. Design system — borrowed from LifeOS

The app is **not** styled from scratch. It copies the palette and type already running in
`navysum/life-os-portal`, because that look is already right.

**This is a look, not a link.** The two share nothing else — separate codebase, separate
database, separate account, separate data. Copy the token values in once and they are yours
to change freely; there is no sync to maintain and no dependency to break.

Source of truth: `life-os-portal/src/styles/variables.css`.

**Typography**
- `--font-ui` = **DM Sans** (variable) — everything you read.
- `--font-mono` = **Cascadia Code** (variable) — every number, code and uppercase micro-label,
  always with `tabular-nums`.
- Both TTFs live in `life-os-portal/fonts/`. Copy those files and register them with
  `expo-font`. Do not re-source them from Google Fonts, or weights will drift apart.

**Palette** (light / dark)

| Token | Light | Dark |
| --- | --- | --- |
| `--palette-background` | `#ffffff` | `#000000` |
| `--palette-primary` (text) | `#171717` | `#f2f2ee` |
| `--text-secondary` | `#737373` | `#a9aaa6` |
| `--text-muted` | `#949494` | `#777a76` |
| `--bg-surface` | `#ffffff` | `#101110` |
| `--bg-surface-muted` | `#f5f5f3` | `#252725` |
| `--border-default` | `#e4e4e1` | `#292b29` |
| `--accent` (primary action, violet) | `#765ceb` | `#8b67f5` |
| `--amber` (pending / warn) | `#a46f2b` | `#c39552` |
| `--blue` | `#3f5a80` | `#7691bc` |
| `--purple` | `#6c4f80` | `#a189b3` |
| `--teal` | `#2f7266` | `#6ba597` |
| `--coral` | `#a15547` | `#c48f7c` |

**Layout and component rules** (as the portal already applies them)
- Flat surfaces: 1px `--border-default`, `--card-radius` 8px, `--button-radius` 6px, **no shadows**.
- Spacing tokens: `--page-padding` 32px, `--section-gap` 20px, `--card-gap` 14px.
- Micro-labels: 8px, weight 600, uppercase, `0.06em` tracking, `--text-muted`.
- Rows are separated by hairline bottom borders, not gaps; `:last-child` drops the border.
- Pills: `999px` radius, soft tint background with matching foreground, mono 8px uppercase.
- Bottom nav (from `MobileNav.css`): 72px min-height, 19px icons, 9px labels, active state `--green`.

**The check-in circle is already designed.** `HabitsCard.css` defines it: 18px, filled
`--green` when complete, a 2px `--amber` ring when not. That is the single most important
control in the app and it is inherited, not invented.

**Porting note.** React Native has no CSS custom properties. Port `variables.css` once into a
typed `theme.ts` exporting the same token names, selecting light or dark from the device
setting. After that one copy, the file belongs to this app.

## 3. Stack

| Piece | Choice | Why |
| --- | --- | --- |
| App | Expo (React Native) + TypeScript | One codebase for iOS and Android; cloud builds mean no Mac required |
| Theme | Ported `variables.css` → `theme.ts` | A one-time copy of the LifeOS tokens. No shared package, no coupling |
| Fonts | `expo-font` with the portal's TTFs | DM Sans and Cascadia Code bundled — identical rendering to the dashboard |
| Backend | Supabase | Hosted Postgres + Google auth + realtime + row-level security in one service |
| Login | Native Google Sign-In → `supabase.auth.signInWithIdToken` | Native account picker instead of a browser bounce |
| Data layer | TanStack Query | Caching, optimistic check-ins, automatic retry |
| Live updates | Supabase Realtime | Group board updates when a friend checks in |
| Notifications | Expo Notifications + scheduled Edge Function | Habit reminders and friend-activity pushes |
| Shipping | EAS Build & Submit | Builds and store uploads from one command |

Cost: Supabase free tier to start ($25/mo Pro later), Apple $99/yr, Google Play $25 once.

## 4. Screens

1. **Sign in** — Continue with Google, Continue with Apple.
2. **Today** — segmented Mine / Shared; habit cards with a tap-to-check circle and streak.
3. **Group board** — habits down, members across, a grid of filled/empty circles.
4. **Habit detail** — streak, 30-day rate, heatmap, notes.
5. **Join a group** — six-character code entry with a live group preview, or create one.
6. **Leaderboard** — group streak, perfect days, members ranked by consistency with
   week-over-week deltas.
7. **Habit stats** — per-habit group completion, strongest / needs work, standouts.
8. **Activity** — check-ins, streak milestones, joins; emoji reactions and nudges.
9. **New habit** — one sheet; name required, everything else defaulted.
10. **Manage habits** — drag to reorder, swipe to archive or delete, restore archived.

## 5. Schema

```
profiles       id(uuid, = auth user) · display_name · avatar_url · timezone
groups         id · name · emoji · invite_code(unique) · created_by · created_at
group_members  group_id · user_id · role(owner|member) · joined_at   [PK: group_id,user_id]
habits         id · owner_id · group_id(nullable) · title · emoji · colour
               · cadence(daily|weekly|days) · target_days int[] · reminder_at
               · sort_order · created_at · archived_at
check_ins      id · habit_id · user_id · local_date · note · created_at
               [UNIQUE: habit_id, user_id, local_date]
reactions      check_in_id · user_id · emoji                [PK: all three]
nudges         id · habit_id · from_user · to_user · created_at
```

**Streaks are computed on read, never stored.** A stored counter drifts as soon as a
check-in arrives late from an offline device. Denormalise only if a screen gets slow.

## 6. Invite codes

1. Creating a group generates a 6-character code from an alphabet excluding `0 O 1 I`.
2. Sharing uses the native share sheet plus a deep link that pre-fills the code.
3. Joining calls one RPC, `join_group_with_code(code)` — the app never queries `groups`
   directly by code.
4. That function is `security definer`: find group, insert membership, return group.
   Ordinary users therefore never hold read access to the whole `groups` table, so
   codes can't be scraped.
5. Rate-limit the function (~10 attempts/hour/user) or the code space is brute-forceable.

## 7. Row-level security

| Table | Read | Write |
| --- | --- | --- |
| profiles | You + anyone sharing a group with you | Own row |
| groups | Members | Owner |
| group_members | Members of that group | Self (leave), owner (remove) |
| habits | Owner, or members of its group | Owner; group habits by any member |
| check_ins | Anyone who can see the habit | Only rows where `user_id = auth.uid()` |
| reactions / nudges | Group members | Only as yourself |

**Avoid the recursion trap.** A policy on `group_members` that queries `group_members`
causes infinite recursion. Put the membership test in a `security definer stable`
helper function (`is_group_member(gid uuid)`) and call that from every policy.

Private habits have no group and no policy grants anyone else access. Warn clearly
before converting a private habit to shared — it cannot be un-seen.

## 8. Leaderboard and habit stats

Every figure here is derived from `check_ins` — **no new tables**. If the leaderboard needed
one, the core model would be wrong.

### Rank consistency, not volume

Counting check-ins rewards whoever tracks the most habits. Rank on **completed ÷ expected**
as a percentage instead.

`expected` = for each (member, shared habit), the days in the window where all hold:
- the habit existed and was not archived (`habits.created_at`, `habits.archived_at`)
- the member had already joined (`group_members.joined_at`)
- the day matches the cadence

Weekly-target habits are not per-day: `completed ÷ (weeks × target)`.

### Only shared habits count

Non-negotiable. If private habits fed the percentage, the leaderboard would leak them — a
score moving on a day someone logged nothing shared reveals private activity. The RLS rules
hide the rows; the maths must respect them too.

### Make last place survivable

- **Rank a week, not all time.** Everyone starts level on Monday.
- **Show most improved beside the ranking** — the only way to win available to the person at
  the bottom.
- **Put a collective number above the competitive one.** Group streak = consecutive days
  where every member hit at least one shared habit.

### Rank people, diagnose habits

People get a rank and a percentage and are never labelled "worst". Habits get judged
bluntly, because the judgement is actionable: a habit at 29% across the whole group is a
badly-set target, not four lazy people. The "needs work" tile should offer *move the time*,
*lower the target*, *drop it* — not just name it.

Screens: **Leaderboard** (group streak / perfect days / group rate, then ranked members with
consistency bars and week-over-week deltas) and **Habit stats** (per-habit group completion,
strongest, needs work, longest streak, most improved, never missed).

### Guard rail — backfilling

Unrestricted past-dating means the leaderboard is won by whoever backfills a month on Sunday
night. But late writes can't simply be banned — the offline queue legitimately sends
yesterday's check-in today. The distinction is already in the table: `local_date` is the day
it counts for, `created_at` is when it arrived. Let the offline queue write freely; cap
*manual* backdating at ~3 days in the insert policy.

### Where to compute it

Start on the client — the group board already holds this week's check-ins, so the weekly
ranking is arithmetic on data in hand and updates live for free. Move to a
`group_leaderboard(group_id, since)` RPC for all-time figures or once groups get large.

## 9. Managing habits

People abandon habit trackers because editing them is a chore. Adding one must take two taps
and nothing but a name.

### Adding

`+ Add habit` sits in the header of every habit list — never more than one tap away. The sheet
requires only a name. Defaults: neutral icon, palette green, daily cadence, reminder off,
visibility **Private**. Sharing is always a deliberate act, never the default.

### Removing — two different things

Most people who want a habit "gone" mean *stop showing it to me*, not *destroy the record*.

| Action | What happens | Who can do it |
| --- | --- | --- |
| **Archive** | Sets `archived_at`. Drops off Today, keeps every check-in and the streak record, restorable in one tap. | Owner; any member for a group habit |
| **Delete** | Removes the habit and every check-in against it. Not reversible. | Owner only |

**Group habits need a stronger guard.** Deleting a shared habit destroys *other people's*
history. Only the group owner may delete one, and the confirmation must state the actual loss
— "this deletes 312 check-ins from 4 people" — not a generic "are you sure?". Any member can
archive a group habit for the whole group; that is recoverable.

### Gestures

- Swipe a row → Archive / Delete.
- Hold and drag to reorder → needs `habits.sort_order`, cheap now, annoying to retrofit.
- Tap a row → detail, edited in the same sheet used to create it. One form to build, one to learn.

**Rule of thumb:** adding is one tap and no decisions; removing is one swipe with a
recoverable default. If either needs a trip into Settings, it is built wrong.

## 10. Known pitfalls

- **Timezones.** Compute `local_date` on the device from the user's timezone; never
  derive the day from a UTC timestamp server-side.
- **Apple review.** Offering Google sign-in obliges you to offer Sign in with Apple.
  Build it before the first submission.
- **Offline.** Write locally, show the tick immediately, queue the upload. The unique
  key makes retries idempotent.
- **Nudge limits.** One per person, per habit, per day, plus a global off switch.
- **Leaving a group.** Decide up front whether history is removed or retained-but-hidden.

## 11. Working without a laptop

Building this from an iPad and iPhone is entirely possible — the whole toolchain for this
stack already runs in the cloud. No Mac is involved at any point: not development, not the
iOS build, not App Store submission.

### Writing the code

- **github.dev** (press `.` on any repo) is a full editor in Safari, with no local install.
  Review pull requests in GitHub's web UI.
- **Working Copy** is a good native iPad git client if you prefer an app.

### Seeing it run

One Expo constraint drives the decision: **Expo Go** can only run libraries Expo bundled into
it, and native Google Sign-In is not one of them.

| Route | What you get | Cost |
| --- | --- | --- |
| Expo Go | Instant preview of Phases 0–3. Use Supabase's browser-based Google login, switch to native later — a few lines' difference. | Free |
| Development build | Your own app on the home screen, all native modules, over-the-air updates. Needed eventually regardless. | Apple Developer, $99/yr |
| Android device | Same development build, installed from a link. | Free |

**Recommendation:** stay on Expo Go with browser-based login through Phase 3. It costs
nothing, needs no build step, and reaches the group board — the point where the app is the
product. Pay the $99 at Phase 4, when the native login sheet and push notifications are
wanted anyway.

Once on a development build the loop is: push code → `eas update` publishes the new JS →
the phone picks it up on next open, usually under a minute, over cellular. No dev server
tethered to a machine at home.

### Shipping

**EAS Build** compiles the iOS app on Expo's Macs; **EAS Submit** uploads to App Store
Connect, which works fine in Safari on iPad. Screenshots can be captured on the phone. The
$99 Apple fee and $25 Google fee are the only hard requirements — neither is a computer.

**The one genuine limitation:** debugging is harder without a desktop — no side-by-side
simulator, no browser devtools. Manageable if work stays in small verifiable steps, which
the phase plan already enforces.

## 12. Build order

| Phase | Scope | Done when |
| --- | --- | --- |
| 0 | Expo app (via Expo Go) + Supabase project + `theme.ts` + fonts + tab shell | Running on your phone |
| 1 | Browser-based Google login, profiles, add/archive/reorder habits, check-ins, streaks | Usable solo tracker |
| 2 | Groups, invite codes, membership, RLS policies | A friend appears in your app |
| 3 | Shared habits, Shared tab, group board, realtime | The actual product |
| 4 | Activity feed, reactions, nudges, weekly leaderboard, habit stats; first dev build + native login | A reason to open it daily |
| 5 | Push reminders, offline queue, edit/archive, account deletion | Handable to a stranger |
| 6 | Sign in with Apple, privacy policy, store listings, TestFlight | A link you can text people |

Phases 0–3 are the build; 4–6 are finishing.
