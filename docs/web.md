# StreakMates on the web

One codebase, three targets. `expo export --platform web` produces a static
site — an `index.html`, a JavaScript bundle and the fonts — which any free
static host will serve. The phone apps are unaffected; nothing here replaces
them.

## Deploying to Vercel

1. **Import the repository** at [vercel.com/new](https://vercel.com/new). Leave
   the framework preset as "Other" — `vercel.json` in the repo root already
   declares the build command, the output directory and the routing.

2. **Add the two environment variables**, for Production, Preview and
   Development:

   | Name | Value |
   | --- | --- |
   | `EXPO_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | the anon key |

   These are the same values as `.env`. They are baked into the bundle at build
   time, which is why the build must be re-run after changing one — and why
   nothing secret can go here. The anon key is meant to be public; row-level
   security is what protects the data. `docs/security.md` covers why.

3. **Deploy.** The first build takes a couple of minutes.

4. **Tell Supabase and Google about the new address** — see below. Until you do,
   sign-in fails, and it fails in a way that looks like a bug in the app rather
   than a missing setting.

Netlify and Cloudflare Pages work identically: build `npx expo export --platform
web --output-dir dist`, publish `dist`, and add the same single-page fallback
(everything that is not a real file → `/index.html`).

> On free tiers, check the terms against what you intend. Vercel's Hobby plan
> has historically been for non-commercial use, which is worth confirming before
> StreakMates has a price on it. Cloudflare Pages has no such restriction.

## Sign-in needs two allowlists

Google OAuth refuses to redirect anywhere it has not been told about. Both of
these need the deployed origin, and Vercel gives every branch its own preview
URL, so add the production domain at least.

**Supabase** → Authentication → URL Configuration
- *Site URL*: `https://your-app.vercel.app`
- *Redirect URLs*: `https://your-app.vercel.app/**`
  (keep the existing `exp://` and `streakmates://` entries — those are the phone
  apps, and removing them breaks Expo Go)

**Google Cloud console** → the OAuth client Supabase uses
- *Authorised JavaScript origins*: `https://your-app.vercel.app`
- The *redirect URI* stays Supabase's own `https://<ref>.supabase.co/auth/v1/callback`
  — Google always returns to Supabase, which then returns to the app.

## What differs on the web

The web build is the same app, not a cut-down one, but three things cannot work
the same way and are handled rather than left to fail.

| | Phone | Web |
| --- | --- | --- |
| Habit reminders | Scheduled on the device | **Not offered.** The field is replaced with "On the phone app" |
| Focus alarm | Fires with the app closed | Silent; the timer itself is correct, because it is derived from the clock rather than counted down |
| Where the session lives | iOS Keychain / Android Keystore | `localStorage` |
| "Are you sure?" | Native alert | The browser's own confirm |
| Share an invite code | Share sheet | Share sheet where the browser has one, otherwise copied to the clipboard |

**Reminders.** A browser cannot wake itself at 07:00. Doing it properly needs a
service worker, a push server and VAPID keys, which a static site does not have.
Rather than accept a time it can never honour, the web build says where that
setting lives. A reminder set on the phone keeps working and still shows on the
habit's screen.

**The session in `localStorage`.** This is the one real security difference, and
it is worth being straight about: on a phone the refresh token sits in the
Keychain, and on the web it sits in `localStorage`, where any script running on
the page could read it. That is the standard position for every browser-based
Supabase app and the reason the CSP-adjacent headers in `vercel.json` exist —
but it is weaker than the phone, and someone on a shared computer should sign
out rather than close the tab.

## Why `vercel.json` looks like that

- **The rewrite** sends everything that is not a real file to `/index.html`.
  Expo Router is a single-page app on web: without this, `/groups` works when
  you navigate to it and 404s when you refresh or share the link.
  The negative lookahead is what keeps `/_expo/…`, `/assets/…`, `/favicon.ico`
  and anything with a file extension being served as themselves.
- **The immutable cache headers** apply only to `_expo/` and `assets/`, whose
  filenames contain a content hash. `index.html` is deliberately left
  uncached, so a deploy is picked up on the next load.
- **`X-Frame-Options: DENY`** because the app has destructive actions —
  delete account, delete habit, leave group — and a framed app is how those get
  clicked by accident on somebody else's page.

## Running it locally

```bash
npm run web         # dev server, hot reload
npm run build:web   # static export into dist/
```

To check the built site the way Vercel serves it, you need the same fallback —
`npx serve dist -s` will do it. Opening `dist/index.html` from the filesystem
will not: the bundle is requested from an absolute path.
