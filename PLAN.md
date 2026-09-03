# Habits With Friends — Plan v1

A habit tracker where you keep private habits to yourself and put shared habits in
front of a small group of friends who can see, react and nudge.

A rendered version of this plan (with screen mockups) lives in `docs/plan.html`.

## 1. The core idea

- A **private habit** is a row in `habits` owned by you, with `group_id` null.
- A **shared habit** is *one* row owned by a group. Every member checks in against
  that same row.
- Nothing is duplicated per person. A `check_ins` table keyed by
  `(habit_id, user_id, local_date)` does all the work.

The group board is simply: for today's date, who has a check-in row and who doesn't.

## 2. Stack

| Piece | Choice | Why |
| --- | --- | --- |
| App | Expo (React Native) + TypeScript | One codebase for iOS and Android; cloud builds mean no Mac required |
| Backend | Supabase | Hosted Postgres + Google auth + realtime + row-level security in one service |
| Login | Native Google Sign-In → `supabase.auth.signInWithIdToken` | Native account picker instead of a browser bounce |
| Data layer | TanStack Query | Caching, optimistic check-ins, automatic retry |
| Live updates | Supabase Realtime | Group board updates when a friend checks in |
| Notifications | Expo Notifications + scheduled Edge Function | Habit reminders and friend-activity pushes |
| Shipping | EAS Build & Submit | Builds and store uploads from one command |

Cost: Supabase free tier to start ($25/mo Pro later), Apple $99/yr, Google Play $25 once.

## 3. Screens

1. **Sign in** — Continue with Google, Continue with Apple.
2. **Today** — segmented Mine / Shared; habit cards with a tap-to-check circle and streak.
3. **Group board** — habits down, members across, a grid of filled/empty circles.
4. **Habit detail** — streak, 30-day rate, heatmap, notes.
5. **Join a group** — six-character code entry with a live group preview, or create one.
6. **Activity** — check-ins, streak milestones, joins; emoji reactions and nudges.

## 4. Schema

```
profiles       id(uuid, = auth user) · display_name · avatar_url · timezone
groups         id · name · emoji · invite_code(unique) · created_by · created_at
group_members  group_id · user_id · role(owner|member) · joined_at   [PK: group_id,user_id]
habits         id · owner_id · group_id(nullable) · title · emoji · colour
               · cadence(daily|weekly|days) · target_days int[] · reminder_at · archived_at
check_ins      id · habit_id · user_id · local_date · note · created_at
               [UNIQUE: habit_id, user_id, local_date]
reactions      check_in_id · user_id · emoji                [PK: all three]
nudges         id · habit_id · from_user · to_user · created_at
```

**Streaks are computed on read, never stored.** A stored counter drifts as soon as a
check-in arrives late from an offline device. Denormalise only if a screen gets slow.

## 5. Invite codes

1. Creating a group generates a 6-character code from an alphabet excluding `0 O 1 I`.
2. Sharing uses the native share sheet plus a deep link that pre-fills the code.
3. Joining calls one RPC, `join_group_with_code(code)` — the app never queries `groups`
   directly by code.
4. That function is `security definer`: find group, insert membership, return group.
   Ordinary users therefore never hold read access to the whole `groups` table, so
   codes can't be scraped.
5. Rate-limit the function (~10 attempts/hour/user) or the code space is brute-forceable.

## 6. Row-level security

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

## 7. Known pitfalls

- **Timezones.** Compute `local_date` on the device from the user's timezone; never
  derive the day from a UTC timestamp server-side.
- **Apple review.** Offering Google sign-in obliges you to offer Sign in with Apple.
  Build it before the first submission.
- **Offline.** Write locally, show the tick immediately, queue the upload. The unique
  key makes retries idempotent.
- **Nudge limits.** One per person, per habit, per day, plus a global off switch.
- **Leaving a group.** Decide up front whether history is removed or retained-but-hidden.

## 8. Build order

| Phase | Scope | Done when |
| --- | --- | --- |
| 0 | Expo app + Supabase project + tab shell | App icon on your home screen |
| 1 | Google login, profiles, private habits, check-ins, streaks | Usable solo tracker |
| 2 | Groups, invite codes, membership, RLS policies | A friend appears in your app |
| 3 | Shared habits, Shared tab, group board, realtime | The actual product |
| 4 | Activity feed, reactions, nudges | A reason to open it daily |
| 5 | Push reminders, offline queue, edit/archive, account deletion | Handable to a stranger |
| 6 | Sign in with Apple, privacy policy, store listings, TestFlight | A link you can text people |

Phases 0–3 are the build; 4–6 are finishing.
