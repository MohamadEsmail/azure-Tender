-- ============================================================================
-- 0004_storage_and_job_queue.sql
-- Private storage for brief/attachment files, and the worker's job-claim
-- primitive.
-- ============================================================================

-- Private bucket. Objects are pathed "<project_id>/<file_id>-<name>", so the
-- first folder segment is the project id used by the policies below.
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "pf_select" on storage.objects for select to authenticated
using (
  bucket_id = 'project-files'
  and public.auth_is_project_member(((storage.foldername(name))[1])::uuid)
);
create policy "pf_insert" on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-files'
  and public.auth_is_project_member(((storage.foldername(name))[1])::uuid)
);
create policy "pf_delete" on storage.objects for delete to authenticated
using (
  bucket_id = 'project-files'
  and public.auth_is_project_member(((storage.foldername(name))[1])::uuid)
);

-- Atomically claim the next queued job. Service-role only. FOR UPDATE SKIP
-- LOCKED lets multiple workers run concurrently without a message broker.
create or replace function claim_next_job()
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  j public.jobs;
begin
  select * into j from public.jobs
  where status = 'queued'
  order by created_at
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update public.jobs
  set status = 'running', started_at = now(), attempts = attempts + 1
  where id = j.id
  returning * into j;

  return j;
end;
$$;

revoke execute on function claim_next_job() from public, anon, authenticated;
grant execute on function claim_next_job() to service_role;
