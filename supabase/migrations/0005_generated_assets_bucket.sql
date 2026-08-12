-- ============================================================================
-- 0005_generated_assets_bucket.sql
-- Private bucket for generated images (moodboards, space renders). Objects are
-- pathed "<project_id>/<kind>/<asset_id>.<ext>", member-scoped like the brief
-- files bucket.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', false)
on conflict (id) do nothing;

create policy "pa_select" on storage.objects for select to authenticated
using (
  bucket_id = 'project-assets'
  and public.auth_is_project_member(((storage.foldername(name))[1])::uuid)
);
create policy "pa_insert" on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-assets'
  and public.auth_is_project_member(((storage.foldername(name))[1])::uuid)
);
create policy "pa_delete" on storage.objects for delete to authenticated
using (
  bucket_id = 'project-assets'
  and public.auth_is_project_member(((storage.foldername(name))[1])::uuid)
);
