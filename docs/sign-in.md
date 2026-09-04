# Ways in

Three, and they behave differently enough to be worth writing down.

| | Works today | Needs |
| --- | --- | --- |
| Google | Yes | Already configured |
| Email and password | Yes | One Supabase setting, below |
| Apple | **No** | An Apple Developer account, $99/year |

## Email and password

Nothing to install. Supabase has this on by default; the only thing to decide
is confirmation.

### Confirmation, and why it matters in Expo Go

Supabase emails a confirmation link on sign-up. The link points back at the
app, and **in Expo Go that address is an `exp://` URL that changes every time
the tunnel restarts** — so a link from yesterday's session opens nothing.

While testing in Expo Go, either:

- **Turn confirmation off.** Supabase → Authentication → Sign In / Providers →
  Email → uncheck **Confirm email**. Sign-up then signs you straight in.
  Turn it back on before anyone outside the three of you has an account.
- **Or leave it on** and accept that you follow the link in the same session it
  was sent in.

In a development or production build the address is `streakmates://`, which is
stable, and the flow works normally.

### Redirect URLs

Under Authentication → URL Configuration, the **Redirect URLs** list needs:

```
streakmates://auth-callback
exp://*                       (only while using Expo Go over a tunnel)
```

Without the first, sign-in and reset links fail in a real build. Drop the
second once you have a build.

### Resetting a password

"Forgot password?" emails a link that lands on `/auth-callback`, which swaps
the code for a session and asks for a new password. The screen deliberately
says the same thing whether or not the address has an account, so the form
cannot be used to find out who is signed up.

### Password rules

Eight characters minimum, 72 bytes maximum. The ceiling is not arbitrary:
bcrypt, which Supabase hashes with, ignores anything past 72 bytes, so a longer
password would appear to work while a truncated version was what actually
guarded the account. It is refused rather than silently cut. A short list of
first-guess passwords is refused too.

## Sign in with Apple

**Blocked on the $99/year Apple Developer Program, and there is no way around
it.** Apple will not issue the Services ID or the signing key without a paid
membership, and Supabase needs both to talk to Apple at all. This is true of
the web flow as well as the native button — paying is the only path.

The code is written and waiting. The button is behind
`EXPO_PUBLIC_APPLE_SIGN_IN` so it does not ship as a control that always fails.

Once there is an account:

1. Apple Developer → Certificates, Identifiers & Profiles
   - An **App ID** for `com.navysum.streakmates` with **Sign in with Apple** enabled
   - A **Services ID**, with the return URL `https://<project-ref>.supabase.co/auth/v1/callback`
   - A **Key** with Sign in with Apple enabled — download the `.p8` once; Apple
     will not show it again
2. Supabase → Authentication → Providers → Apple: enable it, and paste the
   Services ID, Team ID, Key ID and the key's contents
3. Set `EXPO_PUBLIC_APPLE_SIGN_IN=1` in `.env`

**It is not optional for the App Store.** Apple's guidelines require Sign in
with Apple wherever a third-party social login is offered, so the moment
Google is in the build, Apple has to be too or review rejects it. Google Play
has no equivalent rule, which is one reason shipping Android first is cheaper.

## What an account actually is

All three end at the same place: a row in `auth.users`, and a `profiles` row
created by the `handle_new_user` trigger. The display name comes from whatever
the provider gave — Google's `full_name`, the name typed at sign-up, or the
part of the email before the `@` as a last resort. Everything after that is
identical whichever way you came in.

Whether signing up with Google and then with the same address and a password
gives you one account or two depends on Supabase's identity-linking setting and
on whether the address is confirmed. Worth testing deliberately with a spare
address before other people rely on it, rather than assuming either way.
