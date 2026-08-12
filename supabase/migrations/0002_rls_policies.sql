-- ============================================================================
-- 0002_rls_policies.sql
-- Row Level Security for every table.
--
-- Model:
--   * Project-scoped tables: visible/editable to members of that project (and
--     admins). Cross-table checks use the SECURITY DEFINER helpers from 0001 to
--     avoid recursion.
--   * Org-wide library tables (blocks, company_*, kb_*): internal staff/admin.
--   * New-project bootstrap (creating a project + first membership atomically)
--     runs through a trusted server action using the service client, so the
--     policies below only need to cover the steady state.
--
-- V1 keeps write access at member granularity; per-role write tightening (e.g.
-- only an approver may decide a gate) is enforced in each module's server
-- actions and hardened here as those modules land.
-- ============================================================================

create or replace function auth_is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'staff')
  );
$$;

-- Enable RLS everywhere.
alter table profiles            enable row level security;
alter table projects            enable row level security;
alter table project_members     enable row level security;
alter table project_files       enable row level security;
alter table brief_data          enable row level security;
alter table field_flags         enable row level security;
alter table assignments         enable row level security;
alter table jobs                enable row level security;
alter table gates               enable row level security;
alter table comments            enable row level security;
alter table audit_log           enable row level security;
alter table agent_runs          enable row level security;
alter table blocks              enable row level security;
alter table project_blocks      enable row level security;
alter table company_projects    enable row level security;
alter table company_people      enable row level security;
alter table company_suppliers   enable row level security;
alter table company_certs       enable row level security;
alter table creative_strategy   enable row level security;
alter table visual_dna          enable row level security;
alter table spaces              enable row level security;
alter table assets              enable row level security;
alter table moodboards          enable row level security;
alter table moodboard_items     enable row level security;
alter table generations         enable row level security;
alter table revisions           enable row level security;
alter table presentations       enable row level security;
alter table presentation_slides enable row level security;
alter table kb_documents        enable row level security;
alter table kb_chunks           enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy profiles_select on profiles for select using (
  id = auth.uid() or auth_is_admin() or auth_shares_project(id)
);
create policy profiles_update_self on profiles for update using (
  id = auth.uid()
) with check (id = auth.uid());
create policy profiles_admin_all on profiles for all using (auth_is_admin())
  with check (auth_is_admin());

-- ----------------------------------------------------------------------------
-- projects + membership
-- ----------------------------------------------------------------------------
create policy projects_select on projects for select using (
  auth_is_project_member(id) or auth_is_admin()
);
create policy projects_update on projects for update using (
  auth_is_admin()
  or auth_has_project_role(id, array['lead','project_manager','creative_director']::project_role[])
) with check (
  auth_is_admin()
  or auth_has_project_role(id, array['lead','project_manager','creative_director']::project_role[])
);
create policy projects_admin_all on projects for all using (auth_is_admin())
  with check (auth_is_admin());

create policy members_select on project_members for select using (
  auth_is_project_member(project_id) or auth_is_admin()
);
create policy members_manage on project_members for all using (
  auth_is_admin()
  or auth_has_project_role(project_id, array['lead','project_manager']::project_role[])
) with check (
  auth_is_admin()
  or auth_has_project_role(project_id, array['lead','project_manager']::project_role[])
);

-- ----------------------------------------------------------------------------
-- Project-scoped tables: members (or admins) may read and write.
-- ----------------------------------------------------------------------------
create policy files_member    on project_files    for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy brief_member    on brief_data       for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy flags_member    on field_flags      for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy assign_member   on assignments      for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy jobs_member     on jobs             for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy gates_member    on gates            for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy comments_member on comments         for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy agentruns_member on agent_runs      for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy pblocks_member  on project_blocks   for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy strategy_member on creative_strategy for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy vdna_member     on visual_dna       for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy spaces_member   on spaces           for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy assets_member   on assets           for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy moodboards_member on moodboards     for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy generations_member on generations   for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());
create policy presentations_member on presentations for all
  using (auth_is_project_member(project_id) or auth_is_admin())
  with check (auth_is_project_member(project_id) or auth_is_admin());

-- audit_log: readable by members, but append-only from the app (no update/delete).
create policy audit_select on audit_log for select using (
  auth_is_project_member(project_id) or auth_is_admin()
);
create policy audit_insert on audit_log for insert with check (
  auth_is_project_member(project_id) or auth_is_admin()
);

-- ----------------------------------------------------------------------------
-- Child tables gated through their parent's project membership.
-- ----------------------------------------------------------------------------
create policy mbitems_member on moodboard_items for all using (
  exists (
    select 1 from moodboards m
    where m.id = moodboard_items.moodboard_id
      and (auth_is_project_member(m.project_id) or auth_is_admin())
  )
) with check (
  exists (
    select 1 from moodboards m
    where m.id = moodboard_items.moodboard_id
      and (auth_is_project_member(m.project_id) or auth_is_admin())
  )
);

create policy revisions_member on revisions for all using (
  exists (
    select 1 from generations g
    where g.id = revisions.generation_id
      and (auth_is_project_member(g.project_id) or auth_is_admin())
  )
) with check (
  exists (
    select 1 from generations g
    where g.id = revisions.generation_id
      and (auth_is_project_member(g.project_id) or auth_is_admin())
  )
);

create policy slides_member on presentation_slides for all using (
  exists (
    select 1 from presentations p
    where p.id = presentation_slides.presentation_id
      and (auth_is_project_member(p.project_id) or auth_is_admin())
  )
) with check (
  exists (
    select 1 from presentations p
    where p.id = presentation_slides.presentation_id
      and (auth_is_project_member(p.project_id) or auth_is_admin())
  )
);

-- ----------------------------------------------------------------------------
-- Org-wide library tables: internal staff read; admin (blocks) / staff (rest) write.
-- ----------------------------------------------------------------------------
create policy blocks_read  on blocks for select using (auth_is_staff());
create policy blocks_admin on blocks for all using (auth_is_admin())
  with check (auth_is_admin());

create policy coproj_staff on company_projects  for all using (auth_is_staff())
  with check (auth_is_staff());
create policy copeople_staff on company_people   for all using (auth_is_staff())
  with check (auth_is_staff());
create policy cosupp_staff  on company_suppliers for all using (auth_is_staff())
  with check (auth_is_staff());
create policy cocert_staff  on company_certs     for all using (auth_is_staff())
  with check (auth_is_staff());

create policy kbdocs_staff  on kb_documents for all using (auth_is_staff())
  with check (auth_is_staff());
create policy kbchunks_staff on kb_chunks for all using (
  exists (
    select 1 from kb_documents d
    where d.id = kb_chunks.kb_document_id and auth_is_staff()
  )
) with check (
  exists (
    select 1 from kb_documents d
    where d.id = kb_chunks.kb_document_id and auth_is_staff()
  )
);
