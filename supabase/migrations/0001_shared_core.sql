-- ============================================================================
-- 0001_shared_core.sql
-- Foundation schema for the Azure Creative Platform.
--
-- Implements the shared brief-intelligence core plus the table skeletons for
-- both production tracks (Proposal = A, Creative = B), per ARCHITECTURE.md §6.
--
-- Principles enforced here:
--   * The extracted brief lives in a single jsonb column (brief_data.data).
--   * Every extractable fact carries a confidence level + source page.
--   * Row Level Security on EVERY table; a user sees only projects they belong
--     to. Cross-table checks go through SECURITY DEFINER helpers to avoid RLS
--     recursion.
--   * "tenders" is generalised to "projects" with a project_type.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists vector;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type app_role as enum ('admin', 'staff', 'client');

create type project_type as enum ('tender', 'pitch', 'hybrid');

create type project_status as enum (
  'draft', 'extracting', 'awaiting_data', 'brief_approved',
  'in_strategy', 'in_outline', 'in_moodboard', 'in_visual_dna',
  'in_spatial', 'in_visualization', 'in_review', 'in_revision',
  'approved', 'presentation_ready', 'delivered'
);

-- Per-project role. Global role lives on profiles; fine-grained creative and
-- proposal roles are assigned per project membership.
create type project_role as enum (
  'creative_director', 'art_director', 'designer_3d', 'graphic_designer',
  'project_manager', 'lead', 'approver', 'member', 'viewer', 'client_viewer'
);

create type confidence_level as enum ('green', 'amber', 'red');
create type field_status as enum ('unconfirmed', 'confirmed', 'filled');

create type job_type as enum (
  'extract', 'outline', 'block_generate', 'dossier_render',
  'strategy', 'moodboard', 'visual_dna', 'space_plan',
  'image_generate', 'image_revise', 'qa_check',
  'presentation_build', 'presentation_render'
);
create type job_status as enum ('queued', 'running', 'succeeded', 'failed');

create type gate_status as enum ('pending', 'approved', 'rejected');

create type artifact_status as enum (
  'draft', 'internal_review', 'revision_required', 'approved',
  'client_review', 'client_revision', 'final'
);

-- ----------------------------------------------------------------------------
-- Identity
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role app_role not null default 'staff',
  created_at timestamptz not null default now()
);

-- Auto-create a profile when an invited user is provisioned in auth.users.
-- Role can be seeded from invite metadata (raw_user_meta_data.role).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::app_role, 'staff')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- Projects + membership
-- ----------------------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  project_type project_type not null default 'tender',
  title text not null,
  client text,
  contract_no text,
  deadline date,
  status project_status not null default 'draft',
  tracks text[] not null default array['proposal', 'creative'],
  owner_id uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role project_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);
create index on project_members (user_id);
create index on project_members (project_id);

-- ----------------------------------------------------------------------------
-- RLS helper functions (SECURITY DEFINER — bypass RLS to prevent recursion)
-- ----------------------------------------------------------------------------
create or replace function auth_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function auth_is_project_member(p_project uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from project_members
    where project_id = p_project and user_id = auth.uid()
  );
$$;

create or replace function auth_has_project_role(p_project uuid, p_roles project_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from project_members
    where project_id = p_project
      and user_id = auth.uid()
      and role = any (p_roles)
  );
$$;

create or replace function auth_shares_project(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from project_members pm_self
    join project_members pm_other
      on pm_self.project_id = pm_other.project_id
    where pm_self.user_id = auth.uid()
      and pm_other.user_id = p_user
  );
$$;

-- ----------------------------------------------------------------------------
-- Brief intelligence (shared core) — the single jsonb record
-- ----------------------------------------------------------------------------
create table project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  path text not null,            -- private Storage object path
  kind text not null,            -- 'brief' | 'attachment' | 'floorplan' | ...
  mime text,
  size bigint,
  uploaded_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index on project_files (project_id);

create table brief_data (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version int not null default 1,
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now(),
  unique (project_id, version)
);
create index on brief_data (project_id);

create table field_flags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  field_path text not null,       -- dotted path into brief_data.data
  confidence confidence_level not null,
  source_page int,
  status field_status not null default 'unconfirmed',
  unique (project_id, field_path)
);
create index on field_flags (project_id);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  field_path text not null,
  assignee_id uuid references profiles (id),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index on assignments (project_id);

-- ----------------------------------------------------------------------------
-- Jobs, gates, comments, audit, agent traces (shared)
-- ----------------------------------------------------------------------------
create table jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  type job_type not null,
  status job_status not null default 'queued',
  progress int not null default 0,
  payload jsonb not null default '{}'::jsonb,
  error text,
  attempts int not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index on jobs (project_id);
create index on jobs (status);

create table gates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  gate_key text not null,         -- 'G1', 'G4B', ...
  status gate_status not null default 'pending',
  decided_by uuid references profiles (id),
  decided_at timestamptz,
  note text,
  unique (project_id, gate_key)
);
create index on gates (project_id);

create table comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  target_type text not null,      -- 'generation' | 'block' | 'field' | 'project'
  target_id text,
  body text not null,
  author_id uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index on comments (project_id);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects (id) on delete cascade,
  actor_id uuid references profiles (id),
  action text not null,
  from_state text,
  to_state text,
  meta jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index on audit_log (project_id);

create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  agent text not null,
  model text,
  prompt_hash text,
  tokens_in int,
  tokens_out int,
  cost numeric(12, 6),
  status text,
  trace jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index on agent_runs (project_id);

-- ----------------------------------------------------------------------------
-- Track A — Proposal
-- ----------------------------------------------------------------------------
create table blocks (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  template text,
  is_active boolean not null default true
);

create table project_blocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  block_id uuid references blocks (id),
  sort_order int not null default 0,
  target_pages int,
  status text not null default 'queued',
  output jsonb,
  created_at timestamptz not null default now()
);
create index on project_blocks (project_id);

-- Company Library (org-wide, not project-scoped)
create table company_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null, client text, year int, scope text,
  images text[], certificate_path text,
  created_at timestamptz not null default now()
);
create table company_people (
  id uuid primary key default gen_random_uuid(),
  name text not null, title text, cv_path text, years_exp int
);
create table company_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null, category text, rating int, notes text
);
create table company_certs (
  id uuid primary key default gen_random_uuid(),
  name text not null, kind text, path text, valid_until date
);

-- ----------------------------------------------------------------------------
-- Track B — Creative
-- ----------------------------------------------------------------------------
create table creative_strategy (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version int not null default 1,
  status artifact_status not null default 'draft',
  updated_at timestamptz not null default now(),
  unique (project_id, version)
);
create index on creative_strategy (project_id);

create table visual_dna (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  version int not null default 1,
  status artifact_status not null default 'draft',
  data jsonb not null default '{}'::jsonb,   -- geometry, materials, colours,
                                             -- lighting, forbidden styles, refs
  updated_at timestamptz not null default now(),
  unique (project_id, version)
);
create index on visual_dna (project_id);

create table spaces (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  type text not null,             -- 'main_stage' | 'registration' | ...
  name_ar text, name_en text,
  sort_order int not null default 0,
  requirements jsonb not null default '{}'::jsonb,
  status artifact_status not null default 'draft'
);
create index on spaces (project_id);

-- Immutable, content-addressed assets. A version is never overwritten.
create table assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  storage_path text not null,
  mime text,
  checksum text,
  width int, height int,
  created_by_job uuid references jobs (id),
  created_at timestamptz not null default now()
);
create index on assets (project_id);

create table moodboards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  version int not null default 1,
  status artifact_status not null default 'draft',
  created_at timestamptz not null default now()
);
create table moodboard_items (
  id uuid primary key default gen_random_uuid(),
  moodboard_id uuid not null references moodboards (id) on delete cascade,
  category text,
  image_asset_id uuid references assets (id),
  caption text,
  source text
);

create table generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  space_id uuid references spaces (id) on delete cascade,
  kind text not null default 'space_render',
  version int not null default 1,
  status artifact_status not null default 'draft',
  asset_id uuid references assets (id),
  provider text,
  model text,
  settings jsonb not null default '{}'::jsonb,
  prompt text,
  reference_asset_ids uuid[],
  parent_generation_id uuid references generations (id),
  qa jsonb,
  created_at timestamptz not null default now()
);
create index on generations (project_id);
create index on generations (space_id);
create index on generations (parent_generation_id);

create table revisions (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references generations (id) on delete cascade,
  mode text not null,             -- 'i2i' | 'prompt' | 'reference' | 'selective'
  instruction text not null,
  result_generation_id uuid references generations (id),
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table presentations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  version int not null default 1,
  status artifact_status not null default 'draft',
  structure jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table presentation_slides (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references presentations (id) on delete cascade,
  section text not null,
  sort_order int not null default 0,
  content jsonb not null default '{}'::jsonb,
  asset_ids uuid[]
);

-- ----------------------------------------------------------------------------
-- Knowledge base (RAG) — org-wide
-- ----------------------------------------------------------------------------
create table kb_documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  project_ref uuid references projects (id) on delete set null,
  title text,
  body text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table kb_chunks (
  id uuid primary key default gen_random_uuid(),
  kb_document_id uuid not null references kb_documents (id) on delete cascade,
  content text not null,
  embedding vector(1536)
);

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at before update on projects
  for each row execute function set_updated_at();
create trigger brief_data_updated_at before update on brief_data
  for each row execute function set_updated_at();
