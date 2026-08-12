import "server-only";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { createSignedUrl, PROJECT_ASSETS_BUCKET } from "@/lib/storage";
import type { VisualDNA } from "@/lib/agents/art-director";

export interface VisualDnaState {
  moodboardApproved: boolean;
  dna: VisualDNA | null;
  status: string | null;
  referenceUrls: string[];
  job: { status: string; error: string | null } | null;
}

export async function getVisualDnaState(
  projectId: string,
): Promise<VisualDnaState | null> {
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const { data: g3b } = await supabase
    .from("gates")
    .select("status")
    .eq("project_id", projectId)
    .eq("gate_key", "G3B")
    .maybeSingle();

  const { data: row } = await supabase
    .from("visual_dna")
    .select("data, status")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();

  const dna = (row?.data ?? null) as VisualDNA | null;

  const referenceUrls: string[] = [];
  if (dna?.reference_asset_ids?.length) {
    const { data: assetRows } = await supabase
      .from("assets")
      .select("id, storage_path")
      .in("id", dna.reference_asset_ids);
    for (const a of (assetRows ?? []) as { storage_path: string }[]) {
      referenceUrls.push(
        await createSignedUrl(a.storage_path, 60 * 30, PROJECT_ASSETS_BUCKET),
      );
    }
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("status, error")
    .eq("project_id", projectId)
    .eq("type", "visual_dna")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    moodboardApproved: (g3b as { status?: string } | null)?.status === "approved",
    dna,
    status: (row as { status?: string } | null)?.status ?? null,
    referenceUrls,
    job: (job as VisualDnaState["job"]) ?? null,
  };
}
