# CLAUDE.md

## What this project is

An internal tender-dossier production system for a creative agency that bids on
government and municipal event/exhibition tenders in the UAE and Saudi Arabia.

Staff upload a tender document (usually a scanned or exported PDF, often Arabic),
the system extracts it into a structured project record, staff fill the gaps the
document cannot supply, and the system generates a complete proposal dossier from
a library of reusable blocks.

**Users are designers and project managers, not engineers.** Every screen must be
usable without training.

## Core architectural rule

The browser never generates. It uploads, displays, edits, and reviews.

All extraction, text generation, image generation, and PDF rendering run as
**background jobs** on the server. A full dossier takes minutes, not seconds.
Never build a UI that blocks on a generation call — always write a job row,
return immediately, and poll or subscribe for status.

API keys live in server-side secrets only. If you ever find yourself putting a
model API key where client code can read it, stop and reconsider the design.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- Supabase: Auth, Postgres, Storage, Row Level Security
- Background jobs: a `jobs` table + a worker route; do not reach for a queue
  service until the simple version proves insufficient
- PDF rendering: headless Chromium (Playwright) over an HTML template
- Anthropic SDK for extraction and generation

## Language and direction

- **Code, comments, commits, docs, variable names: English.**
- **Product UI: Arabic-first, full RTL.** English is secondary.
- Arabic content is the deliverable, so Arabic text handling is a correctness
  concern, not a polish concern. Test Arabic rendering in the PDF pipeline
  in week one, not at the end — RTL + Arabic shaping breaks late and expensively.
- Use `dir="rtl"` at the layout level and logical CSS properties
  (`margin-inline-start`, not `margin-left`) throughout.

## Data model principle

The extracted tender lives in a single `jsonb` column (`tender_data.data`).
Tender structures vary enormously between clients — an exhibition stand RFP and a
15-event municipal services contract share almost no fields. Do not model tender
fields as columns. Model them as JSON, and let the UI render from a field map.

## Extraction is unreliable by design

The extractor will get things wrong. That is expected and must be visible.
Every extracted field carries a confidence level and a source page number:

- `green` — high confidence
- `amber` — extracted, needs human confirmation
- `red` — missing, a human must supply it

Clicking a field jumps the PDF viewer to its source page. This traceability is
the feature that makes the system trustworthy. Do not treat it as optional.

## What not to do

- Do not invent tender facts. If a value is not in the source document, it is
  `red` and a human fills it. Never let a model fabricate a deadline, an area,
  a quantity, or a penalty amount.
- Do not add public sign-up. Access is invite-only, admin-issued.
- Do not store tender files in public buckets. Government tender documents are
  contractually confidential — private Storage, RLS, signed time-limited URLs.
- Do not build phases 4 and 5 before 1 and 2 work. See SPEC.md.

## Working style

- Small, reviewable commits with a clear message.
- Write the migration alongside the feature that needs it.
- Prefer boring, obvious code. This system will be maintained by whoever is free,
  not by a specialist.
- When a requirement is ambiguous, ask rather than guess — a wrong assumption
  buried in a schema is expensive to unwind.

## Reference files

- `SPEC.md` — screens, data model, flow, build phases
- `samples/alain-g242026.json` — a real extracted tender, use it as the fixture
  for every screen you build
