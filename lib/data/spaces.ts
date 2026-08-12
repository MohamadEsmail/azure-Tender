import "server-only";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { createSignedUrl, PROJECT_ASSETS_BUCKET } from "@/lib/storage";

export interface RenderView {
  id: string;
  version: number;
  status: string;
  url: string | null;
}

export interface SpaceView {
  id: string;
  type: string;
  name_ar: string | null;
  name_en: string | null;
  requirements: string;
  rationale: string;
  renders: RenderView[];
}

export interface SpacesState {
  visualDnaLocked: boolean;
  spacePlanApproved: boolean;
  spaces: SpaceView[];
  spacePlanJob: { status: string; error: string | null } | null;
  rendersRunning: boolean;
}

export async function getSpacesState(
  projectId: string,
): Promise<SpacesState | null> {
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const { data: gates } = await supabase
    .from("gates")
    .select("gate_key, status")
    .eq("project_id", projectId)
    .in("gate_key", ["G4B", "G5B"]);
  const gateStatus = (k: string) =>
    (gates ?? []).find((g) => (g as { gate_key: string }).gate_key === k) as
      | { status: string }
      | undefined;

  const { data: spaceRows } = await supabase
    .from("spaces")
    .select("id, type, name_ar, name_en, requirements")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  const { data: genRows } = await supabase
    .from("generations")
    .select("id, space_id, version, status, assets(storage_path)")
    .eq("project_id", projectId)
    .order("version", { ascending: true });

  // Group renders by space and sign their URLs.
  const rendersBySpace = new Map<string, RenderView[]>();
  for (const g of (genRows ?? []) as unknown as {
    id: string;
    space_id: string | null;
    version: number;
    status: string;
    assets: { storage_path: string } | null;
  }[]) {
    if (!g.space_id) continue;
    const url = g.assets?.storage_path
      ? await createSignedUrl(g.assets.storage_path, 60 * 30, PROJECT_ASSETS_BUCKET)
      : null;
    const list = rendersBySpace.get(g.space_id) ?? [];
    list.push({ id: g.id, version: g.version, status: g.status, url });
    rendersBySpace.set(g.space_id, list);
  }

  const spaces: SpaceView[] = ((spaceRows ?? []) as {
    id: string;
    type: string;
    name_ar: string | null;
    name_en: string | null;
    requirements: { text?: string; rationale?: string } | null;
  }[]).map((s) => ({
    id: s.id,
    type: s.type,
    name_ar: s.name_ar,
    name_en: s.name_en,
    requirements: s.requirements?.text ?? "",
    rationale: s.requirements?.rationale ?? "",
    renders: rendersBySpace.get(s.id) ?? [],
  }));

  const { data: planJob } = await supabase
    .from("jobs")
    .select("status, error")
    .eq("project_id", projectId)
    .eq("type", "space_plan")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: runningRender } = await supabase
    .from("jobs")
    .select("id")
    .eq("project_id", projectId)
    .in("type", ["image_generate", "image_revise"])
    .in("status", ["queued", "running"])
    .limit(1)
    .maybeSingle();

  return {
    visualDnaLocked: gateStatus("G4B")?.status === "approved",
    spacePlanApproved: gateStatus("G5B")?.status === "approved",
    spaces,
    spacePlanJob: (planJob as SpacesState["spacePlanJob"]) ?? null,
    rendersRunning: Boolean(runningRender),
  };
}
