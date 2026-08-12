import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runVisualDNA } from "@/lib/agents/art-director";
import type { CreativeStrategy } from "@/lib/agents/creative-strategist";

interface JobRow {
  id: string;
  project_id: string;
  payload: Record<string, unknown>;
}

/**
 * Visual DNA handler: distils the strategy + approved moodboard into the Visual
 * DNA object, and pins the approved moodboard images as the canonical reference
 * set that later renders seed from (the consistency mechanism).
 */
export async function handleVisualDna(
  service: SupabaseClient,
  job: JobRow,
): Promise<void> {
  const projectId = job.project_id;

  const { data: strategyRow } = await service
    .from("creative_strategy")
    .select("data")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();
  const strategy = (strategyRow?.data ?? null) as CreativeStrategy | null;
  if (!strategy) throw new Error("No creative strategy found.");

  // Approved moodboard = the reference set.
  const { data: mb } = await service
    .from("moodboards")
    .select("id")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();

  const referenceAssetIds: string[] = [];
  const categories: string[] = [];
  if (mb) {
    const { data: items } = await service
      .from("moodboard_items")
      .select("category, image_asset_id")
      .eq("moodboard_id", (mb as { id: string }).id);
    for (const it of (items ?? []) as {
      category: string | null;
      image_asset_id: string | null;
    }[]) {
      if (it.image_asset_id) referenceAssetIds.push(it.image_asset_id);
      if (it.category) categories.push(it.category);
    }
  }

  const { data: dna, usage } = await runVisualDNA(strategy, categories);

  const data = {
    ...dna,
    reference_asset_ids: referenceAssetIds,
    canonical_asset_id: referenceAssetIds[0] ?? null,
  };

  const { error } = await service.from("visual_dna").upsert(
    {
      project_id: projectId,
      version: 1,
      status: "draft",
      data: data as unknown as Record<string, unknown>,
    },
    { onConflict: "project_id,version" },
  );
  if (error) throw new Error(error.message);

  await service
    .from("gates")
    .upsert(
      { project_id: projectId, gate_key: "G4B", status: "pending" },
      { onConflict: "project_id,gate_key" },
    );

  await service.from("agent_runs").insert({
    project_id: projectId,
    agent: "art_director",
    model: "claude",
    tokens_in: usage.inputTokens,
    tokens_out: usage.outputTokens,
    status: "succeeded",
  });

  await service
    .from("projects")
    .update({ status: "in_visual_dna" })
    .eq("id", projectId);
}
