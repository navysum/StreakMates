# Setting up Supabase

Everything here is done in a browser, so it works from an iPad. Budget about
twenty minutes the first time. You need to do this once; after that the app
just works.

There are four parts: make a project, create the tables, let Google sign
people in, and tell the app where the project is.

---

## 1. Make the project

1. Go to [supabase.com](https://supabase.com) and sign in with GitHub.
2. **New project**. Give it a name (`habits` is fine), pick a strong database
   password (save it somewhere — you won't need it for this, but you will one
   day), and choose the region closest to you.
3. Wait a minute or two while it builds.

## 2. Create the tables

1. In the left sidebar: **SQL Editor** → **New query**.
2. Open [`migrations/0001_init.sql`](./migrations/0001_init.sql) in this repo,
   copy the whole file, and paste it into the editor.
3. Press **Run**.

You should see *Success. No rows returned*. That one file creates every table,
every security rule, and the invite-code functions.

To check it worked, go to **Table Editor** — you should see `profiles`,
`groups`, `group_members`, `habits`, `check_ins` and `invite_code_attempts`.
They're all empty, which is correct.

## 3. Let Google sign people in

This is the fiddliest part, because Google and Supabase each need to know about
the other.

### 3a. Create the Google credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   create a project (any name).
2. **APIs & Services** → **OAuth consent screen**. Choose **External**, fill in
   an app name, your email as both support and developer contact, and save.
3. While that consent screen is in **Testing** mode, only accounts you list can
   sign in. Add your own Google account under **Test users** — miss this and
   sign-in fails with "app is blocked", which looks like a bug but isn't.
4. **Credentials** → **Create credentials** → **OAuth client ID** →
   application type **Web application**.
5. Under **Authorised redirect URIs**, add exactly this, with your own project
   reference in place of `<project-ref>`:

   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

   Your project ref is the string in your Supabase project URL — Supabase shows
   the whole callback URL on the Google provider page in the next step, so you
   can copy it from there rather than assembling it by hand.
6. Save, then copy the **Client ID** and **Client secret**.

### 3b. Tell Supabase about them

1. Supabase → **Authentication** → **Sign In / Providers** → **Google**.
2. Turn it on, paste the client ID and secret, and save.

### 3c. Allow the app's redirect

After Google finishes, Supabase sends the browser back to the app. It will only
send it to addresses you have allowed.

1. Supabase → **Authentication** → **URL Configuration**.
2. Under **Redirect URLs**, add both of these:

   ```
   exp://**
   habits://**
   ```

`exp://**` covers Expo Go, whose address changes every time the tunnel
restarts — that wildcard is why you don't have to come back here each session.
`habits://**` is this app's own scheme, used once you move to a development
build. Both are development conveniences; tighten them before the app ships.

## 4. Point the app at the project

1. Supabase → **Project Settings** → **API**.
2. Copy the **Project URL** and the **anon public** key.
3. In the Codespace terminal:

   ```bash
   cp .env.example .env
   ```

4. Open `.env` and fill both values in.
5. **Restart the dev server** (`Ctrl+C`, then `npm run tunnel`). Environment
   variables are read when the bundle is built, so a running server won't pick
   up a new `.env`.

Open the app and the sign-in screen should now offer **Continue with Google**
instead of the setup notice.

---

## Is the anon key safe in the app?

Yes. It only ever grants what the row-level security policies allow, and those
are written to assume the client is hostile. It is meant to ship in the bundle.

The key you must never put in the app is the **service role** key, which
bypasses every policy. It is not used anywhere in this project.

## What the security rules actually do

| Table | Who can read | Who can write |
| --- | --- | --- |
| `profiles` | You, plus anyone sharing a group with you | Only your own |
| `groups` | Members only | The owner |
| `group_members` | Members of that group | Yourself to leave; the owner to remove |
| `habits` | The owner, or members of its group | The owner; group habits by any member |
| `check_ins` | Anyone who can see the habit | Only your own, dated within 3 days |
| `invite_code_attempts` | Nobody | Nobody (written by the server only) |

Two details worth knowing, because both are easy to get wrong:

**No client can search the `groups` table by code.** There is no policy that
allows reading a group you are not in, so joining goes through
`join_group_with_code()`, which runs with elevated rights. That is what stops
someone scraping the whole code space. Those lookups are rate limited to ten an
hour per person.

**Membership checks live in `SECURITY DEFINER` functions.** A policy on
`group_members` that queries `group_members` would make Postgres check the rule
in order to check the rule — infinite recursion, and every query fails. Calling
`is_group_member()` instead avoids it. If you ever add a table that references
membership, use the same helpers.

## Changing the schema later

Add a new numbered file in `migrations/` rather than editing `0001_init.sql`.
Anything already applied to a real database will not be re-run, so edits to an
old file silently do nothing.
