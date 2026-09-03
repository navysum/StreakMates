# Habits With Friends

A habit tracker where the streak isn't only yours. Private habits stay private; shared
habits go in front of a small group of friends who can see, react and nudge.

iOS and Android from one codebase — Expo (React Native) + TypeScript, with Supabase for
auth and data.

- **Full plan:** [`PLAN.md`](./PLAN.md) · rendered with screen mockups in [`docs/plan.html`](./docs/plan.html)
- **Status:** Phase 0 complete — app shell, design system, fonts, four tabs.

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

> **Pick the right branch.** Until this work is merged, the app lives on
> `claude/shared-habit-tracker-plan-iyq4xz`, not on `main` — a Codespace created on `main`
> has no `package.json` and `npm install` fails with `ENOENT`. Either switch the branch in
> the Code menu *before* creating the Codespace, or fix it afterwards in the terminal:
>
> ```bash
> git fetch origin
> git checkout claude/shared-habit-tracker-plan-iyq4xz
> ```

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

## What's in Phase 0

| | |
| --- | --- |
| `app/_layout.tsx` | Loads the six fonts, holds the splash screen until they're ready, provides the theme |
| `app/(tabs)/` | Today, Groups, Activity, You — the four tabs, with a nav bar built to the LifeOS spec |
| `src/theme/tokens.ts` | The design tokens: palette (light + dark), type scale, spacing, radii |
| `src/theme/ThemeProvider.tsx` | Follows the device's light/dark setting automatically |
| `src/components/` | `Card`, `Screen`, `HabitRow`, `StatusDot`, `TabIcon`, `Placeholder` |
| `src/lib/supabase.ts` | Client that stays `null` until `.env` is filled in, so the app runs without a backend |
| `assets/fonts/` | DM Sans and Cascadia Code, static instances + their OFL licences |

The Today tab shows **sample habits**, clearly labelled as such. They exist so you can
check on a real device that the fonts, colours, dark mode and the check-in circle all
render correctly. Phase 1 replaces them with real data.

### About the fonts

The design system comes from `navysum/life-os-portal`, which ships DM Sans and Cascadia
Code as *variable* fonts. React Native doesn't handle variable font weights reliably, so
the weights used here were generated as static instances from those exact same source
files — same design, one file per weight:

`DMSans-Regular / Medium / SemiBold / Bold`, `CascadiaCode-Regular / SemiBold`.

---

## Supabase

Not needed yet — the app runs without it. When you create a project (Phase 1):

```bash
cp .env.example .env
```

Fill in the URL and anon key from your Supabase project's API settings. Both are safe to
ship in the app bundle: the anon key only ever grants what your row-level security policies
allow.

---

## Scripts

```bash
npm run tunnel      # dev server reachable from anywhere (use this one)
npm start           # dev server, same network only
npm run typecheck   # tsc --noEmit
npm run web         # run in a browser
```
