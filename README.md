# TurkmenHub

> Land in a new city and find your people in a minute.

TurkmenHub is an invite-only web app that helps Turkmens living abroad find each other. Someone who just moved to a city can see which Turkmens already live there. They can also message the ones who chose to be reachable, on WhatsApp or Telegram.

**Live:** https://turkmen-hub.vercel.app

New here and want to help? Go to [Contributing](#contributing). You can run the whole app on your machine in about 15 minutes.

---

## Table of contents

- [Who it's for](#who-its-for)
- [How it works](#how-it-works)
- [MVP scope](#mvp-scope)
- [Verification and privacy](#verification-and-privacy)
- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Contributing](#contributing)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Clone and install](#2-clone-and-install)
  - [3. Start a local database](#3-start-a-local-database)
  - [4. Connect the app](#4-connect-the-app)
  - [5. Enable Google sign-in locally](#5-enable-google-sign-in-locally)
  - [6. Add test data](#6-add-test-data)
  - [7. Run the app](#7-run-the-app)
- [Day-to-day development](#day-to-day-development)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [For maintainers](#for-maintainers)

---

## Who it's for

- **Primary:** Turkmen students and workers who recently moved abroad.
- **Secondary:** Long-time community members who can help newcomers.
- **Scope:** Turkmens only. Other Turkic communities are out of scope for now.

## How it works

1. Open the link and sign in with Google.
2. Enter an invite code. This is the verification step.
3. Fill in a profile: nickname, city, a free-form bio, optional WhatsApp/Telegram, and a "visible to others" toggle.
4. Land on the home screen and pick a city.
5. Browse the members on the city page and tap one to open a chat with them.

### Screens

The MVP has 8 screens. Pick an unchecked one if you want something to build.

- [x] Welcome and sign-in
- [x] Invite code
- [x] Profile setup
- [ ] Home: list of cities with member counts
- [ ] City page
- [ ] Member profile
- [ ] Report and block
- [x] Settings: profile, visibility, contacts
- [ ] Settings: language, delete account

### Sketch of the two main screens (example data)

```
HOME                          CITY PAGE
┌─────────────────────┐       ┌───────────────────────────┐
│ TurkmenHub        ⚙ │       │ ← Kuala Lumpur · 12       │
│                     │       │ [ Join the city group ]   │
│ YOUR CITY           │       │                           │
│ Kuala Lumpur    12 ›│       │ NEW THIS WEEK             │
│                     │       │ ● Aman · student          │
│ ALL CITIES     🔍   │       │                           │
│ Istanbul        48 ›│       │ MEMBERS                   │
│ Xi'an            9 ›│       │ ● Maral · IT   [WhatsApp] │
│ Berlin           6 ›│       │ ● Serdar · UM  [Telegram] │
└─────────────────────┘       └───────────────────────────┘
```

## MVP scope

| In the MVP                      | Not in the MVP             |
| ------------------------------- | -------------------------- |
| Google sign-in                  | In-app chat                |
| Invite-based verification       | Feeds, likes, comments     |
| Profiles with free-form bio     | Events and Q&A board       |
| City list with counts           | Places map                 |
| City page with members          | Push notifications         |
| WhatsApp/Telegram deep links    | Other Turkic countries     |
| City group link                 | Native iOS/Android apps    |
| Report, block, delete account   | Vouch-based verification   |
| Turkmen and English UI          |                            |

If you want to build something from the right-hand column, open an issue first so we can discuss it.

## Verification and privacy

These rules are enforced in the database with Postgres row-level security (RLS). The UI does not enforce them, so a bug in the frontend cannot leak data.

- **Invites:** The founder issues the first codes. Each verified member gets 3 invites. The app records who invited whom, so if one member turns out to be a bad actor, everyone they brought in can be traced and removed too.
- **Access:** Unverified users can see nothing except their own profile.
- **Visibility:** The app only ever shows a member's city, never a more exact location. Real names are optional.
- **Contact details:** Stored in a separate table. Only verified members can see them, and only for people who chose to share them.
- **Rules:** No political content. Every profile has report and block buttons. Members can fully delete their account from inside the app.

## Tech stack

| Layer    | Tech                                                                                     |
| -------- | ---------------------------------------------------------------------------------------- |
| Frontend | [Next.js](https://nextjs.org) 16 (App Router, React 19), installable PWA, mobile-first, [Tailwind CSS](https://tailwindcss.com) 4 |
| Backend  | [Supabase](https://supabase.com): Google auth, Postgres with row-level security, database functions |
| Hosting  | [Vercel](https://vercel.com)                                                             |

> **Heads-up:** Next.js 16 has breaking changes compared to older versions you may know. For example, middleware is now called `proxy.ts`, and `cacheComponents` is turned on. Before using an API you're unsure about, check the docs bundled in `node_modules/next/dist/docs/`.

## Data model

All of the schema lives in [`supabase/migrations/`](supabase/migrations/).

| Table      | What it holds                                                               |
| ---------- | --------------------------------------------------------------------------- |
| `profiles` | One row per user: nickname, city, bio, visibility, language, verification   |
| `contacts` | WhatsApp/Telegram details, kept separate so they get their own access rules |
| `cities`   | Cities with English and Turkmen names and an optional group link            |
| `invites`  | Invite codes: who created each one and who used it                          |
| `blocks`   | Who blocked whom. Blocks hide members in both directions                    |
| `reports`  | Reports on members, reviewed by the founder                                 |

There is one function the app calls: **`redeem_invite(code)`**. In a single step, it marks the user as verified and gives them 3 invite codes of their own. Call it from the app with `supabase.rpc("redeem_invite", { invite_code })`.

A new profile row is created automatically when someone signs up for the first time (this is done by a database trigger).

---

## Contributing

These steps run the full stack on your own machine: the Next.js app plus a local Supabase database. You don't need access to the production project, and nothing you do locally can affect real users.

### 1. Prerequisites

| Tool                                                          | Why                                         |
| ------------------------------------------------------------- | ------------------------------------------- |
| [Node.js](https://nodejs.org) 20.9 or newer (22 LTS recommended) | Runs Next.js                             |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Runs the local Supabase stack. **It must be running** before step 3 |
| [Git](https://git-scm.com)                                    | Version control                             |

You don't need to install the Supabase CLI globally. It's a dev dependency in this repo, so run it with `npx supabase ...`.

### 2. Clone and install

```bash
git clone https://github.com/ez1z/TurkmenHub.git
cd TurkmenHub
npm install
```

### 3. Start a local database

```bash
npx supabase start
```

The first run downloads the Docker images, which takes a few minutes. Later runs take seconds. The CLI then applies every migration in `supabase/migrations/`, so your local database has the same tables, functions, and RLS policies as production.

When it's done, you get these local URLs:

| Service           | URL                          |
| ----------------- | ---------------------------- |
| API               | http://127.0.0.1:54321       |
| Studio (DB admin) | http://127.0.0.1:54323       |
| Mailpit (emails)  | http://127.0.0.1:54324       |

### 4. Connect the app

Create a file named `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your local anon key>
```

To get the anon key, run `npx supabase status -o env` and copy the value of `ANON_KEY`.

> Always use the **anon** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). This project does not use Supabase's newer "publishable" keys. Never put the `service_role` / secret key in the app.

`.env.local` is already gitignored, so you can't commit it by accident.

### 5. Enable Google sign-in locally

Google is the only way to sign in, so you need your own Google OAuth client for local development. You only have to do this once.

1. In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type **Web application**.
2. Under **Authorized redirect URIs**, add:
   ```
   http://127.0.0.1:54321/auth/v1/callback
   ```
3. Add the client ID and secret to a file named `supabase/.env`:
   ```bash
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client id>
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<client secret>
   ```
   This file is also covered by `.gitignore`.
4. In `supabase/config.toml`, add this block below the other `[auth.external.*]` sections:
   ```toml
   [auth.external.google]
   enabled = true
   client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
   secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
   skip_nonce_check = true
   ```
   **Don't commit this change.** If Google isn't configured on another contributor's machine, `supabase start` will fail for them.
5. Restart Supabase so it picks up the new config:
   ```bash
   npx supabase stop && npx supabase start
   ```

### 6. Add test data

Because the app is invite-only, a fresh database has no way in. Open **Studio → SQL Editor** (http://127.0.0.1:54323) and run:

```sql
-- A few cities to browse
insert into public.cities (slug, name_en, name_tk, country_code) values
  ('kuala-lumpur', 'Kuala Lumpur', 'Kuala-Lumpur', 'MY'),
  ('istanbul',     'Istanbul',     'Stambul',      'TR'),
  ('berlin',       'Berlin',       'Berlin',       'DE');

-- A "founder" invite code you can redeem after signing in
insert into public.invites (code) values ('LOCALDEV01');
```

Once you sign in, you can redeem `LOCALDEV01`. That marks you as verified, and you get 3 new codes. You can use them to verify a second Google account so you can test what one member sees of another.

### 7. Run the app

```bash
npm run dev
```

Open **http://localhost:3000**.

🎉 That's it. Click **Continue with Google** and you're in.

---

## Day-to-day development

### Common commands

| Command                    | What it does                                     |
| -------------------------- | ------------------------------------------------ |
| `npm run dev`              | Start the dev server                             |
| `npm run build`            | Production build (run it before opening a PR)    |
| `npm run lint`             | Lint with ESLint                                 |
| `npx tsc --noEmit`         | Type-check                                       |
| `npx supabase start`/`stop`| Start/stop the local database                    |
| `npx supabase db reset`    | Wipe the local DB and re-apply every migration   |
| `npx supabase status`      | Show local URLs and keys                         |

### Changing the database schema

**Every schema change must be a migration file.** Never edit tables by hand in Studio or the production dashboard. Changes made that way aren't recorded anywhere, and nobody else gets them.

1. Create a new migration:
   ```bash
   npx supabase migration new add_something
   ```
   This creates `supabase/migrations/<timestamp>_add_something.sql`.
2. Write your SQL in that file. Every new table needs RLS enabled and explicit policies. Use the existing migration as a guide.
3. Apply it locally:
   ```bash
   npx supabase db reset
   ```
4. Regenerate the TypeScript types from your local database:
   ```bash
   npx supabase gen types typescript --local --schema public > types/database.ts
   ```
5. Commit the migration and `types/database.ts` together.

Never edit a migration that has already been merged. To change something, write a new migration.

### Pull requests

1. Create a branch from `main`, for example `feat/city-page` or `fix/invite-error`.
2. Keep each PR focused on one screen or one change.
3. Before pushing, check that `npm run lint` and `npm run build` both pass.
4. In the PR description, explain what changed. If you changed the UI, add a screenshot taken at mobile width.

### Guidelines

- **Mobile first.** Most people will use the app on a phone, so design for about 375px wide first.
- **Two languages.** Every piece of text users see needs a Turkmen (`tk`) and an English (`en`) version.
- **Security lives in the database.** If something must be hidden from a user, enforce that with an RLS policy. Hiding it in the UI is not enough.
- **No political content,** in the product or in the codebase.

## Project structure

```
app/                    Next.js App Router pages and routes
  auth/callback/        OAuth callback: exchanges Google's code for a session
  welcome/              Welcome and sign-in page
  invite/               Invite code screen (logged-in, unverified users)
  onboarding/           Profile setup screen (verified users without nickname/city)
components/             React components
lib/supabase/
  client.ts             Supabase client for Client Components (browser)
  server.ts             Supabase client for Server Components, Route Handlers, Server Actions
  proxy.ts              Session refresh logic used by the root proxy
proxy.ts                Next.js 16 "proxy" (used to be middleware): refreshes the session on every request
                        and routes users: logged out → /welcome, unverified → /invite,
                        no nickname/city → /onboarding
supabase/
  config.toml           Local Supabase configuration
  migrations/           The database schema, one SQL file per change
types/database.ts       Generated TypeScript types for the database (don't edit by hand)
```

## Troubleshooting

**`supabase start` fails with a Docker error**
Docker Desktop isn't running. Start it, wait until it says it's running, and try again.

**`supabase start` complains about ports already in use**
Another Supabase project is running on your machine. Stop it with `npx supabase stop --project-id <other-project>`, or stop all of them with `docker stop $(docker ps -q)`.

**Every page errors with "supabase URL is required" or similar**
`.env.local` is missing or has the wrong variable names. Check step 4, then restart `npm run dev`.

**Clicking "Continue with Google" sends me back to the welcome page**
- Make sure you opened the app on port 3000. Local Supabase only redirects back to `http://localhost:3000/auth/callback` or `http://127.0.0.1:3000/auth/callback` (see `[auth]` in `supabase/config.toml`).
- Check that the redirect URI in Google Cloud is exactly `http://127.0.0.1:54321/auth/v1/callback`.
- Make sure you restarted Supabase after editing `config.toml`.

**I signed in but can't see any cities or members**
That's expected until you redeem an invite code (see step 6). Unverified users can only read their own profile.

**I changed a migration and nothing happened**
Run `npx supabase db reset` to re-apply all migrations from scratch.

---

## For maintainers

This section is for people with access to the production Supabase and Vercel projects.

### Production setup

- **Supabase → Authentication → URL Configuration:**
  - Site URL: `https://turkmen-hub.vercel.app`
  - Redirect URLs: `https://turkmen-hub.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`
- **Supabase → Authentication → Providers → Google:** enabled, using the production OAuth client.
- **Vercel → Environment Variables:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If either one is missing, every page fails, because the proxy creates a Supabase client on every request.

### Deploying schema changes

```bash
npx supabase login
npx supabase link --project-ref <production-project-ref>
npx supabase db push        # apply new migrations to production
npm run gen:types           # regenerate types from the linked project
```

### Issuing invite codes

Founder codes have no `created_by`. To issue some, run this in the production SQL editor:

```sql
insert into public.invites (code) values ('FIRSTCODE1'), ('FIRSTCODE2');
```

Use only uppercase letters and digits, because `redeem_invite` converts whatever the user types to uppercase before checking it.
