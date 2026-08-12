import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getImageProvider } from "@/lib/providers/image";
import { persistImageFromUrl } from "@/lib/generation/assets";
import { buildSpacePrompt, buildRevisionPrompt } from "@/lib/agents/prompt-engineer";
import { createSignedUrl, PROJECT_ASSETS_BUCKET } from "@/lib/storage";
import type { VisualDNA } from "@/lib/agents/art-director";

interface JobRow {
  id: string;
  project_id: string;
  payload: Record<string, unknown>;
}

async function loadVisualDna(
  service: SupabaseClient,
  projectId: string,
): Promise<VisualDNA> {
  const { data } = await service
    .from("visual_dna")
    .select("data")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();
  const dna = (data?.data ?? null) as VisualDNA | null;
  if (!dna) throw new Error("Visual DNA not found. Build and lock it first.");
  return dna;
}

async function signAsset(
  service: SupabaseClient,
  assetId: string | null | undefined,
): Promise<string | undefined> {
  if (!assetId) return undefined;
  const { data } = await service
    .from("assets")
    .select("storage_path")
    .eq("id", assetId)
    .maybeSingle();
  const path = (data as { storage_path?: string } | null)?.storage_path;
  if (!path) return undefined;
  return createSignedUrl(path, 60 * 30, PROJECT_ASSETS_BUCKET);
}

async function nextVersion(
  service: SupabaseClient,
  spaceId: string,
): Promise<number> {
  const { data } = await service
    .from("generations")
    .select("version")
    .eq("space_id", spaceId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data as { version?: number } | null)?.version ?? 0) + 1;
}

/**
 * Generate a space render, seeded (image-to-image) from the locked Visual DNA
 * canonical reference so it inherits the event's visual family.
 */
export async function handleImageGenerate(
  service: SupabaseClient,
  job: JobRow,
): Promise<void> {
  const projectId = job.project_id;
  const spaceId = String(job.payload.spaceId ?? "");
  if (!spaceId) throw new Error("image_generate requires a spaceId.");

  const dna = await loadVisualDna(service, projectId);

  const { data: space } = await service
    .from("spaces")
    .select("name_ar, name_en, requirements")
    .eq("id", spaceId)
    .maybeSingle();
  if (!space) throw new Error("Space not found.");

  const requirements =
    (space.requirements as { text?: string } | null)?.text ?? "";
  const prompt = buildSpacePrompt(dna, {
    name_en: space.name_en ?? "",
    name_ar: space.name_ar ?? "",
    requirements,
  });

  const referenceUrl = await signAsset(service, dna.canonical_asset_id);
  const provider = getImageProvider();
  const gen = await provider.generate({
    prompt,
    aspectRatio: "16:9",
    referenceImages: referenceUrl ? [referenceUrl] : undefined,
  });

  const { assetId } = await persistImageFromUrl(service, {
    projectId,
    kind: "space_render",
    url: gen.imageUrl,
    jobId: job.id,
  });

  const version = await nextVersion(service, spaceId);
  const { error } = await service.from("generations").insert({
    project_id: projectId,
    space_id: spaceId,
    kind: "space_render",
    version,
    status: "draft",
    asset_id: assetId,
    provider: provider.id,
    model: String(gen.settings.model ?? gen.settings.endpoint ?? ""),
    settings: gen.settings as Record<string, unknown>,
    prompt,
    reference_asset_ids: dna.canonical_asset_id ? [dna.canonical_asset_id] : null,
  });
  if (error) throw new Error(error.message);

  await service
    .from("projects")
    .update({ status: "in_visualization" })
    .eq("id", projectId);
}

/**
 * Revise an existing render: apply only the requested change while preserving
 * everything else (image-to-image from the parent render). Produces a new
 * version linked to its parent; history is never overwritten.
 */
export async function handleImageRevise(
  service: SupabaseClient,
  job: JobRow,
): Promise<void> {
  const projectId = job.project_id;
  const parentId = String(job.payload.generationId ?? "");
  const instruction = String(job.payload.instruction ?? "").trim();
  if (!parentId || !instruction) {
    throw new Error("image_revise requires generationId and instruction.");
  }

  const dna = await loadVisualDna(service, projectId);

  const { data: parent } = await service
    .from("generations")
    .select("id, space_id, prompt, asset_id")
    .eq("id", parentId)
    .maybeSingle();
  if (!parent) throw new Error("Parent generation not found.");

  const p = parent as {
    space_id: string | null;
    prompt: string | null;
    asset_id: string | null;
  };

  const prompt = buildRevisionPrompt(dna, p.prompt ?? "", instruction);
  const referenceUrl = await signAsset(service, p.asset_id);

  const provider = getImageProvider();
  const gen = await provider.generate({
    prompt,
    aspectRatio: "16:9",
    referenceImages: referenceUrl ? [referenceUrl] : undefined,
  });

  const { assetId } = await persistImageFromUrl(service, {
    projectId,
    kind: "space_render",
    url: gen.imageUrl,
    jobId: job.id,
  });

  const version = p.space_id ? await nextVersion(service, p.space_id) : 1;
  const { data: created, error } = await service
    .from("generations")
    .insert({
      project_id: projectId,
      space_id: p.space_id,
      kind: "space_render",
      version,
      status: "draft",
      asset_id: assetId,
      provider: provider.id,
      model: String(gen.settings.model ?? gen.settings.endpoint ?? ""),
      settings: gen.settings as Record<string, unknown>,
      prompt,
      parent_generation_id: parentId,
      reference_asset_ids: p.asset_id ? [p.asset_id] : null,
    })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Insert failed.");

  await service.from("revisions").insert({
    generation_id: parentId,
    mode: "i2i",
    instruction,
    result_generation_id: (created as { id: string }).id,
  });
}
