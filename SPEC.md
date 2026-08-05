# SPEC.md — Tender Dossier System

## 1. Problem

Producing a proposal for a government tender currently takes about seven working
days: one day writing the brief, one analysing it, three generating concepts, one
producing visuals, one assembling the presentation. Most of that work is
structurally identical from tender to tender — only the content changes.

The system automates the repeatable 80% and leaves human judgment where it earns
its keep: understanding the brief, choosing the creative direction, and approving
the final output.

## 2. Architecture

```
Browser (Next.js)
   ↓
Supabase — Auth · Postgres · Storage · RLS
   ↓
Worker (background jobs)
   ↓
extract · generate text · generate images · render PDF
   ↓
Storage → back to the UI
```

Three human gates, everything between them runs unattended:

```
upload PDF
  → [job] extract
  → human: confirm amber fields, fill red fields
  → GATE 1: brief understanding approved
  → system proposes document outline from the scoring table
  → GATE 2: outline approved
  → [jobs] generate each block
  → human: review and edit
  → GATE 3: final approval
  → export PDF + versioned snapshot
```

## 3. Roles

| Role | Permissions |
|---|---|
| `admin` | Everything, plus user management and block library |
| `lead` | Create tenders, generate, edit, export |
| `member` | Fill assigned fields and upload attachments on assigned tenders |
| `approver` | Review and sign off at gates |
| `viewer` | Read only |

Invite-only. Admin invites by email; the user sets a password from the invite
link. RLS on every table — a user sees only tenders they are assigned to.

## 4. Screens

### 4.1 Sign in
Email + password, password reset. No public registration.

### 4.2 Tender list
Columns: title, client, deadline, status, owner, data-completeness percentage.
Primary action: **New tender**.

Statuses:
`draft → extracting → awaiting_data → ready → generating → in_review → approved → submitted`

### 4.3 New tender
Upload one or more files (PDF, DOCX), set a short title and the submission
deadline. Uploading enqueues the extraction job.

### 4.4 Extraction review — the core screen

Two panes:

- **Left:** the source PDF in a viewer
- **Right:** extracted fields grouped in tabs — Meta · Scoring · Scope & Events ·
  Gates · Permits · Penalties · Compliance

Each field shows its confidence colour (green / amber / red) and its source page.
Clicking a field scrolls the left pane to that page.

Amber fields need one click to confirm. Red fields open an input.

### 4.5 Missing data
A focused task list of red fields only, each assignable to a team member.
Input types: text, number, date, table (events, penalties), file upload, and
**pick from Company Library**.

### 4.6 Document outline
The system reads the tender's scoring table and proposes which blocks to include,
in what order, and roughly how many pages each should get based on its weight.
The user reorders by drag, removes, and adds.

Display weight and page count side by side — imbalance should be visible at a
glance. A criterion worth 35% getting one page is the error this screen exists to
catch.

### 4.7 Generation
One button, then a per-block status strip: `queued / running / done / failed —
retry`. Any single block can be regenerated without touching the others.

### 4.8 Review and output
Dossier preview, inline text editing, comments, approver sign-off, PDF export,
versioned snapshot.

### 4.9 Company Library — highest-leverage screen

A permanent archive filled once and reused on every tender:

- **Past projects** — name, client, year, scope, images, completion certificate
- **People** — CVs, titles, years of experience
- **Suppliers and subcontractors** — category, rating, notes
- **Certificates** — ISO, licences, QHSE
- **Blocks** — the approved block library

On a representative municipal tender, past experience (30%) plus proposed
personnel (20%) is **half the technical score**. This screen turns that from a
scramble on every bid into a selection from a list.

### 4.10 Admin
Users and roles, block library, per-client brand templates, audit log.

## 5. Schema

```sql
profiles          id, email, full_name, role, created_at
tenders           id, title, client, contract_no, deadline,
                  status, owner_id, created_at
tender_files      id, tender_id, path, kind, uploaded_by
tender_data       id, tender_id, data jsonb, version, updated_by
field_flags       id, tender_id, field_path, confidence,
                  source_page, status
assignments       id, tender_id, field_path, assignee_id, done
blocks            id, code, name, description, template, is_active
tender_blocks     id, tender_id, block_id, sort_order,
                  target_pages, status, output
jobs              id, tender_id, type, status, progress,
                  error, started_at, finished_at
company_projects  id, name, client, year, scope, images,
                  certificate_path
company_people    id, name, title, cv_path, years_exp
company_suppliers id, name, category, rating, notes
comments          id, tender_id, block_id, body, author_id
```

`tender_data.data` holds the full extracted record. See
`samples/alain-g242026.json` for its shape: `meta`, `scoring[]`, `events[]`,
`sites[]`, `gates[]`, `permits[]`, `penalties[]`, `compliance[]`, and
`inputs_required_from_azure[]`.

## 6. Block library

Blocks are reusable document sections, not per-tender templates. Roughly twenty
cover most tenders:

cover · strategic thesis · objective-to-impact trace · scope coverage ·
**methodology / program of works** · schedule · org chart · risk register ·
QHSE · concept card · element card · floor plan · bill of quantities ·
compliance appendix · closing

A stand-design tender used nine of them. A municipal events contract used eleven,
seven of which were the same blocks. Expect roughly 8 new blocks on the first
tender, 70% reuse by the third, and a new block every second tender after that.

The methodology block is the heaviest single item on most services tenders —
build and validate it first.

## 7. Build phases

| Phase | Scope | Value delivered |
|---|---|---|
| **1** | Auth, tender list, upload, **manual** extraction review screen | One source of truth; no more scattered files |
| **2** | Company Library | Half the technical score becomes ready-made |
| **3** | Automatic extraction + confidence flags | Removes the brief-analysis day |
| **4** | Outline proposal + block generation | Removes the deck-assembly day |
| **5** | Image generation + final PDF rendering | Hardest; build last |

Phase 1 alone is worth running even if nothing after it ships.

## 8. Known constraints

- **Arabic RTL PDF rendering** is the highest technical risk. Prove it in week one
  with a real Arabic page, embedded fonts, and mixed Arabic/Latin numerals.
- **Confidentiality.** Tender documents are contractually confidential. Private
  Storage, RLS, signed time-limited URLs, no public sharing.
- **File size.** Tender packages reach tens of megabytes. Set explicit upload
  limits and compress on ingest.
- **Image consistency** is the hard part of Phase 5, not image quality. Generated
  visuals must trace back to one canonical reference with locked prompt
  parameters, or a forty-image dossier looks like forty different projects.
- **Human review of generated imagery never automates.** Generation produces
  plausible-but-wrong output and cannot tell the difference. Keep an art director
  in the loop.
