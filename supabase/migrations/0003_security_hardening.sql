-- ============================================================================
-- 0003_security_hardening.sql
-- Resolves security-advisor warnings raised after 0001/0002.
--
--   * Pins search_path on the set_updated_at trigger helper.
--   * Removes trigger functions (set_updated_at, handle_new_user) from the
--     PostgREST RPC surface entirely — they run from triggers, not the API.
--   * RLS helper functions: revoked from PUBLIC and anon, granted only to the
--     authenticated role (policy evaluation needs EXECUTE). The remaining
--     "authenticated can execute" notice is inherent to the RLS-helper pattern
--     and is safe: every helper keys off auth.uid() and returns only a boolean.
-- ============================================================================

create or replace function set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger functions: off the API surface completely.
revoke execute on function set_updated_at() from public, anon, authenticated;
revoke execute on function handle_new_user() from public, anon, authenticated;

-- RLS helpers: authenticated only.
revoke execute on function auth_is_admin() from public, anon;
revoke execute on function auth_is_project_member(uuid) from public, anon;
revoke execute on function auth_has_project_role(uuid, project_role[]) from public, anon;
revoke execute on function auth_shares_project(uuid) from public, anon;
revoke execute on function auth_is_staff() from public, anon;

grant execute on function auth_is_admin() to authenticated;
grant execute on function auth_is_project_member(uuid) to authenticated;
grant execute on function auth_has_project_role(uuid, project_role[]) to authenticated;
grant execute on function auth_shares_project(uuid) to authenticated;
grant execute on function auth_is_staff() to authenticated;

-- Note: pgvector remains in the public schema (advisor 0014, WARN). Moving it
-- to a dedicated `extensions` schema is deferred to avoid disturbing the
-- kb_chunks.embedding column; revisit when the RAG module is built.
