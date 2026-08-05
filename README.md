# Tender Dossier System — Phase 1

Internal tender-dossier production system for bidding on UAE / KSA government and
municipal event tenders. See [`CLAUDE.md`](./CLAUDE.md) for the project rules and
[`SPEC.md`](./SPEC.md) for the full specification.

## What Phase 1 delivers

Per `SPEC.md §7`, Phase 1 is: **Auth, tender list, upload, and the manual
extraction-review screen.** Value: one source of truth, no more scattered files.

- **Invite-only auth.** Admin invites by email; the user sets a password from the
  invite link. No public sign-up. (`/login`, `/accept-invite`)
- **Tender list** with title, client, deadline, status, and data-completeness %.
  (`/tenders`)
- **New tender + upload** to a **private** Storage bucket with signed, time-limited
  URLs and RLS. (`/tenders/new`)
- **Extraction review — the core screen.** Two panes: the source document on the
  left, extracted fields on the right, grouped in tabs (Meta · Scoring · Scope &
  Events · Gates · Permits · Penalties · Compliance). Every field carries a
  confidence colour (green / amber / red) and a source page; clicking the page
  jumps the viewer. Amber fields confirm in one click; red inputs are filled by
  hand. (`/tenders/[id]/review`)

The product UI is **Arabic-first and fully RTL**.

### No extraction job yet

Phase 1 has **no extractor** (that is Phase 3). Instead, creating a tender seeds
its record from the real extracted fixture in
[`samples/alain-g242026.json`](./samples/alain-g242026.json), along with a
plausible set of confidence flags and the missing-data task list. This seed is the
stand-in the extraction job will later replace — every review-screen interaction
(edit, confirm, fill) already persists through the real data path.

## Stack

Next.js (App Router) · TypeScript · Tailwind + a small shadcn/ui-style component
set · Supabase (Auth, Postgres, Storage, RLS).

## Getting started

### 1. Create a Supabase project

Then run the migration in [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
against it — via the Supabase SQL editor, or the CLI:

```bash
supabase db push        # with the Supabase CLI linked to your project
```

The migration creates the tables, RLS policies, the private `tender-files`
Storage bucket, and the trigger that provisions a `profiles` row for each
invited user.

### 2. Configure environment

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL
```

`SUPABASE_SERVICE_ROLE_KEY` is **server-only** — it is used solely for
admin-issued invites and must never be exposed to the browser.

### 3. Seed the first admin

Sign-up is invite-only, so bootstrap one admin. Either do it by hand — create a
user in the Supabase dashboard (Authentication → Users), then in the SQL editor
`update profiles set role = 'admin' where email = 'you@example.com';` — or run the
helper (reads `.env.local`):

```bash
node scripts/create-admin.mjs you@example.com 'a-strong-password'
```

That admin can then invite everyone else from the app.

### 4. Run

```bash
npm install
npm run dev        # http://localhost:3000
```

## Local development with the Supabase CLI

To run the whole stack (Postgres, Auth, Storage) locally instead of against a
hosted project — this is the flow used to validate Phase 1 end to end:

```bash
# 1. Start local Supabase (Docker required). Applies supabase/migrations/.
supabase start

# 2. Point the app at the local stack: copy the printed API URL, anon key, and
#    service_role key into .env.local (NEXT_PUBLIC_SUPABASE_URL, etc.).

# 3. Seed a confirmed admin and a demo tender from the fixture.
node scripts/create-admin.mjs
node scripts/seed-demo.mjs

# 4. Run the app and sign in as admin@azure-tender.local / Passw0rd!123
npm run dev
```

`scripts/seed-demo.mjs` stands in for the (Phase 3) extraction job — it loads
`samples/alain-g242026.json` into a tender with confidence flags and the
missing-data list, so the review screen has data to show.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint

## Layout

```
src/
  app/
    login/ accept-invite/ auth/callback/   # invite-only auth
    (app)/
      layout.tsx                           # authed shell (header + sign out)
      tenders/                             # list · new · [id]/review
  components/
    ui/                                    # button, input, tabs, card, …
    review/                                # review-client, pdf-pane
    confidence-badge.tsx  status-badge.tsx
  lib/
    supabase/                              # server, client, admin, middleware
    actions/                               # auth, tenders, review (server actions)
    field-map.ts                           # drives the review screen from JSON
    fixture.ts path.ts types.ts utils.ts
supabase/migrations/0001_init.sql
samples/alain-g242026.json                 # the fixture, used by every screen
```

## Data model note

The extracted tender lives in a single `jsonb` column (`tender_data.data`).
Tender structures vary enormously between clients, so fields are **not** modelled
as columns — the review screen renders them from the field map in
`src/lib/field-map.ts`. Adding a new tender shape means adding map entries, not a
schema migration.
