import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildMoodboardPrompts } from "@/lib/agents/prompt-engineer";
import { getImageProvider } from "@/lib/providers/image";
import { persistImageFromUrl } from "@/lib/generation/assets";
import type { CreativeStrategy } from "@/lib/agents/creative-strategist";

interface JobRow {
  id: string;
  project_id: string;
  payload: Record<string, unknown>;
}

/**
 * Moodboard handler — the platform's first image generation.
 *
 * Reads the creative strategy's visual language, fans it across the moodboard
 * categories (via the Prompt Engineer), generates each image through the active
 * image provider (Higgsfield), and persists the results as immutable assets.
 * Individual image failures don't abort the batch; the job only fails if every
 * image fails.
 */
export async function handleMoodboard(
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
  if (!strategy) throw new Error("No creative strategy to build a moodboard from.");

  const prompts = buildMoodboardPrompts(strategy);
  const provider = getImageProvider();

  // Fresh moodboard each run (regeneration replaces the previous one).
  await service.from("moodboards").delete().eq("project_id", projectId);
  const { data: mb, error: mbError } = await service
    .from("moodboards")
    .insert({ project_id: projectId, version: 1, status: "draft" })
    .select("id")
    .single();
  if (mbError || !mb) throw new Error(mbError?.message ?? "Failed to create moodboard.");
  const moodboardId = (mb as { id: string }).id;

  const results = await Promise.allSettled(
    prompts.map(async (spec) => {
      const gen = await provider.generate({
        prompt: spec.prompt,
        aspectRatio: spec.aspectRatio,
        seed: spec.seed,
      });
      const { assetId } = await persistImageFromUrl(service, {
        projectId,
        kind: "moodboard",
        url: gen.imageUrl,
        jobId: job.id,
      });
      await service.from("moodboard_items").insert({
        moodboard_id: moodboardId,
        category: spec.category_ar,
        image_asset_id: assetId,
        caption: spec.category_ar,
        source: provider.id,
      });
      return spec.category;
    }),
  );

  const ok = results.filter((r) => r.status === "fulfilled").length;
  if (ok === 0) {
    const firstError = results.find((r) => r.status === "rejected") as
      | PromiseRejectedResult
      | undefined;
    throw new Error(
      `All moodboard images failed. ${firstError?.reason ?? ""}`.slice(0, 500),
    );
  }

  await service
    .from("gates")
    .upsert(
      { project_id: projectId, gate_key: "G3B", status: "pending" },
      { onConflict: "project_id,gate_key" },
    );

  await service.from("agent_runs").insert({
    project_id: projectId,
    agent: "moodboard_visualization",
    model: provider.id,
    status: `succeeded ${ok}/${prompts.length}`,
  });

  await service
    .from("projects")
    .update({ status: "in_moodboard" })
    .eq("id", projectId);
}
