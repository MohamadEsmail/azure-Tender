-- Phase 1 schema: profiles, tenders, files, extracted data, field flags,
-- assignments, and per-tender membership. Row Level Security on every table.
--
-- Design notes:
--   * The extracted tender lives in tender_data.data (jsonb). Tender shapes vary
--     enormously between clients, so we do NOT model tender fields as columns.
--   * Confidence + source page are first-class: every extracted field carries a
--     row in field_flags. green = high confidence, amber = confirm, red = missing.
--   * Access is invite-only. A profile is created for each auth user by a trigger.
--     A user sees only tenders they own or are a member of; admins see everything.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('admin', 'lead', 'member', 'approver', 'viewer');

create type tender_status as enum (
  'draft', 'extracting', 'awaiting_data', 'ready',
  'generating', 'in_review', 'approved', 'submitted'
);

create type confidence_level as enum ('green', 'amber', 'red');

-- A flag's workflow state, distinct from its confidence colour:
--   unconfirmed -> a human has not yet acted (amber fields start here)
--   confirmed   -> a human confirmed / supplied the value
--   missing     -> red field still needs a value
create type flag_status as enum ('unconfirmed', 'confirmed', 'missing');

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user, created by trigger on sign-up.
-- ---------------------------------------------------------------------------
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  role       user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- tenders — the core record. Variable fields live in tender_data, not here.
-- ---------------------------------------------------------------------------
create table tenders (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  client      text,
  contract_no text,
  deadline    date,
  status      tender_status not null default 'draft',
  owner_id    uuid not null references profiles (id) on delete restrict,
  created_at  timestamptz not null default now()
);

create index tenders_owner_idx on tenders (owner_id);

-- ---------------------------------------------------------------------------
-- tender_members — who can see / work on a tender (distinct from field-level
-- assignments below). The owner is added here on creation.
-- ---------------------------------------------------------------------------
create table tender_members (
  tender_id uuid not null references tenders (id) on delete cascade,
  user_id   uuid not null references profiles (id) on delete cascade,
  primary key (tender_id, user_id)
);

-- ---------------------------------------------------------------------------
-- tender_files — uploaded source documents. Stored in a PRIVATE bucket; only
-- the storage object path is kept here, never a public URL.
-- ---------------------------------------------------------------------------
create table tender_files (
  id          uuid primary key default gen_random_uuid(),
  tender_id   uuid not null references tenders (id) on delete cascade,
  path        text not null,
  kind        text,               -- e.g. 'pdf', 'docx'
  size_bytes  bigint,
  uploaded_by uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index tender_files_tender_idx on tender_files (tender_id);

-- ---------------------------------------------------------------------------
-- tender_data — the full extracted record as jsonb, versioned.
-- ---------------------------------------------------------------------------
create table tender_data (
  id         uuid primary key default gen_random_uuid(),
  tender_id  uuid not null references tenders (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  version    integer not null default 1,
  updated_by uuid references profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (tender_id, version)
);

create index tender_data_tender_idx on tender_data (tender_id);

-- ---------------------------------------------------------------------------
-- field_flags — confidence + source page per field path (dot/bracket path into
-- tender_data.data, e.g. "meta.contract_no" or "events[3].attendance.max").
-- ---------------------------------------------------------------------------
create table field_flags (
  id          uuid primary key default gen_random_uuid(),
  tender_id   uuid not null references tenders (id) on delete cascade,
  field_path  text not null,
  confidence  confidence_level not null default 'red',
  source_page integer,
  status      flag_status not null default 'missing',
  updated_at  timestamptz not null default now(),
  unique (tender_id, field_path)
);

create index field_flags_tender_idx on field_flags (tender_id);

-- ---------------------------------------------------------------------------
-- assignments — a red/amber field handed to a team member to resolve.
-- ---------------------------------------------------------------------------
create table assignments (
  id          uuid primary key default gen_random_uuid(),
  tender_id   uuid not null references tenders (id) on delete cascade,
  field_path  text not null,
  assignee_id uuid references profiles (id) on delete set null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index assignments_tender_idx on assignments (tender_id);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so policies can consult other tables
-- without recursive RLS). Marked STABLE; search_path pinned.
-- ---------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_tender_member(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from tenders t
    where t.id = tid and t.owner_id = auth.uid()
  ) or exists (
    select 1 from tender_members m
    where m.tender_id = tid and m.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Grants. RLS decides row visibility, but the API roles still need base table
-- privileges. Hosted Supabase applies these via default privileges; granting
-- them explicitly keeps the migration self-sufficient on any environment.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table profiles       enable row level security;
alter table tenders        enable row level security;
alter table tender_members enable row level security;
alter table tender_files   enable row level security;
alter table tender_data    enable row level security;
alter table field_flags    enable row level security;
alter table assignments    enable row level security;

-- profiles: a user reads their own row; admins read/manage all.
create policy profiles_select_self on profiles
  for select using (id = auth.uid() or is_admin());
create policy profiles_update_self on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

-- tenders: members read; leads/admins create; owner or admin update/delete.
create policy tenders_select on tenders
  for select using (is_tender_member(id) or is_admin());
create policy tenders_insert on tenders
  for insert with check (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'lead')
    )
  );
create policy tenders_update on tenders
  for update using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or is_admin());
create policy tenders_delete on tenders
  for delete using (owner_id = auth.uid() or is_admin());

-- tender_members: visible to members; managed by owner/admin.
create policy tender_members_select on tender_members
  for select using (is_tender_member(tender_id) or is_admin());
create policy tender_members_write on tender_members
  for all using (
    is_admin() or exists (
      select 1 from tenders t where t.id = tender_id and t.owner_id = auth.uid()
    )
  ) with check (
    is_admin() or exists (
      select 1 from tenders t where t.id = tender_id and t.owner_id = auth.uid()
    )
  );

-- child tables: gated entirely on tender membership.
create policy tender_files_all on tender_files
  for all using (is_tender_member(tender_id) or is_admin())
  with check (is_tender_member(tender_id) or is_admin());

create policy tender_data_all on tender_data
  for all using (is_tender_member(tender_id) or is_admin())
  with check (is_tender_member(tender_id) or is_admin());

create policy field_flags_all on field_flags
  for all using (is_tender_member(tender_id) or is_admin())
  with check (is_tender_member(tender_id) or is_admin());

create policy assignments_all on assignments
  for all using (is_tender_member(tender_id) or is_admin())
  with check (is_tender_member(tender_id) or is_admin());

-- ---------------------------------------------------------------------------
-- Auth trigger: create a profile row whenever an auth user is created.
-- Invite-only: admins call auth.admin.inviteUserByEmail; this fills the profile.
-- ---------------------------------------------------------------------------
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
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'viewer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Private Storage bucket for tender documents. RLS on storage.objects gates
-- access to tender members. Objects are keyed as: <tender_id>/<filename>.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('tender-files', 'tender-files', false)
on conflict (id) do nothing;

create policy tender_files_storage_all on storage.objects
  for all using (
    bucket_id = 'tender-files'
    and (
      is_admin()
      or is_tender_member((storage.foldername(name))[1]::uuid)
    )
  ) with check (
    bucket_id = 'tender-files'
    and (
      is_admin()
      or is_tender_member((storage.foldername(name))[1]::uuid)
    )
  );
