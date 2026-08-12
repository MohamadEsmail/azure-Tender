import "server-only";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { createSignedUrl } from "@/lib/storage";
import type { BriefExtraction } from "@/lib/agents/brief-analyst";

export interface BriefFileView {
  id: string;
  name: string;
  mime: string | null;
  url: string;
}

export interface BriefState {
  status: string;
  files: BriefFileView[];
  extraction: BriefExtraction | null;
  job: { status: string; error: string | null; created_at: string } | null;
}

/** Everything the extraction-review screen needs, scoped by RLS. */
export async function getBriefState(projectId: string): Promise<BriefState | null> {
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const { data: fileRows } = await supabase
    .from("project_files")
    .select("id, path, mime")
    .eq("project_id", projectId)
    .eq("kind", "brief");

  const files: BriefFileView[] = [];
  for (const row of (fileRows ?? []) as {
    id: string;
    path: string;
    mime: string | null;
  }[]) {
    const name = row.path.split("/").pop() ?? row.path;
    files.push({
      id: row.id,
      name: name.replace(/^[0-9a-f-]{36}-/, ""),
      mime: row.mime,
      url: await createSignedUrl(row.path),
    });
  }

  const { data: brief } = await supabase
    .from("brief_data")
    .select("data")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();

  const { data: job } = await supabase
    .from("jobs")
    .select("status, error, created_at")
    .eq("project_id", projectId)
    .eq("type", "extract")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const data = (brief as { data?: unknown } | null)?.data ?? null;

  return {
    status: (project as { status: string }).status,
    files,
    extraction: (data as BriefExtraction | null) ?? null,
    job: (job as BriefState["job"]) ?? null,
  };
}
