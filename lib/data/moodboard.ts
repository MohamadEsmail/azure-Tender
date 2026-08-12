import "server-only";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { createSignedUrl, PROJECT_ASSETS_BUCKET } from "@/lib/storage";

export interface MoodboardItemView {
  category: string;
  caption: string | null;
  url: string;
}

export interface MoodboardState {
  strategyApproved: boolean;
  items: MoodboardItemView[];
  moodboardStatus: string | null;
  job: { status: string; error: string | null } | null;
}

export async function getMoodboardState(
  projectId: string,
): Promise<MoodboardState | null> {
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const { data: g2b } = await supabase
    .from("gates")
    .select("status")
    .eq("project_id", projectId)
    .eq("gate_key", "G2B")
    .maybeSingle();

  const { data: mb } = await supabase
    .from("moodboards")
    .select("id, status")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();

  const items: MoodboardItemView[] = [];
  if (mb) {
    const { data: rows } = await supabase
      .from("moodboard_items")
      .select("category, caption, assets(storage_path)")
      .eq("moodboard_id", (mb as { id: string }).id);

    for (const row of (rows ?? []) as unknown as {
      category: string | null;
      caption: string | null;
      assets: { storage_path: string } | null;
    }[]) {
      if (!row.assets?.storage_path) continue;
      items.push({
        category: row.category ?? "",
        caption: row.caption,
        url: await createSignedUrl(row.assets.storage_path, 60 * 30, PROJECT_ASSETS_BUCKET),
      });
    }
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("status, error")
    .eq("project_id", projectId)
    .eq("type", "moodboard")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    strategyApproved: (g2b as { status?: string } | null)?.status === "approved",
    items,
    moodboardStatus: (mb as { status?: string } | null)?.status ?? null,
    job: (job as MoodboardState["job"]) ?? null,
  };
}
