import "server-only";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { createSignedUrl, PROJECT_ASSETS_BUCKET } from "@/lib/storage";

export interface SlideView {
  section: string;
  content: Record<string, unknown>;
  imageUrls: string[];
}

export interface PresentationState {
  visualsApproved: boolean;
  slides: SlideView[];
  approved: boolean;
  job: { status: string; error: string | null } | null;
}

export async function getPresentationState(
  projectId: string,
): Promise<PresentationState | null> {
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
    .in("gate_key", ["G6B", "G7B"]);
  const gate = (k: string) =>
    (gates ?? []).find((g) => (g as { gate_key: string }).gate_key === k) as
      | { status: string }
      | undefined;

  const { data: pres } = await supabase
    .from("presentations")
    .select("id")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();

  const slides: SlideView[] = [];
  if (pres) {
    const { data: rows } = await supabase
      .from("presentation_slides")
      .select("section, content, asset_ids")
      .eq("presentation_id", (pres as { id: string }).id)
      .order("sort_order", { ascending: true });

    // Resolve all referenced assets in one query.
    const allIds = new Set<string>();
    for (const r of (rows ?? []) as { asset_ids: string[] | null }[]) {
      (r.asset_ids ?? []).forEach((id) => allIds.add(id));
    }
    const urlById = new Map<string, string>();
    if (allIds.size > 0) {
      const { data: assets } = await supabase
        .from("assets")
        .select("id, storage_path")
        .in("id", [...allIds]);
      for (const a of (assets ?? []) as { id: string; storage_path: string }[]) {
        urlById.set(
          a.id,
          await createSignedUrl(a.storage_path, 60 * 60, PROJECT_ASSETS_BUCKET),
        );
      }
    }

    for (const r of (rows ?? []) as {
      section: string;
      content: Record<string, unknown>;
      asset_ids: string[] | null;
    }[]) {
      slides.push({
        section: r.section,
        content: r.content ?? {},
        imageUrls: (r.asset_ids ?? [])
          .map((id) => urlById.get(id))
          .filter((u): u is string => Boolean(u)),
      });
    }
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("status, error")
    .eq("project_id", projectId)
    .eq("type", "presentation_build")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    visualsApproved: gate("G6B")?.status === "approved",
    slides,
    approved: gate("G7B")?.status === "approved",
    job: (job as PresentationState["job"]) ?? null,
  };
}
