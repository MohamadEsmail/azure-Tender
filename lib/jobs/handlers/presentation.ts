import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runPresentationCopy } from "@/lib/agents/presentation-agent";
import type { BriefExtraction } from "@/lib/agents/brief-analyst";
import type { CreativeStrategy } from "@/lib/agents/creative-strategist";
import type { VisualDNA } from "@/lib/agents/art-director";

interface JobRow {
  id: string;
  project_id: string;
  payload: Record<string, unknown>;
}

interface SlideDraft {
  section: string;
  content: Record<string, unknown>;
  asset_ids: string[];
}

/**
 * Presentation build handler: assembles the proposal deck from the approved
 * artifacts. Only sections with content are included. Slides that show renders
 * carry asset_ids; the preview resolves them to signed URLs.
 */
export async function handlePresentation(
  service: SupabaseClient,
  job: JobRow,
): Promise<void> {
  const projectId = job.project_id;

  const { data: project } = await service
    .from("projects")
    .select("title, client")
    .eq("id", projectId)
    .single();
  if (!project) throw new Error("Project not found.");

  const [{ data: briefRow }, { data: strategyRow }, { data: dnaRow }] =
    await Promise.all([
      service.from("brief_data").select("data").eq("project_id", projectId).eq("version", 1).maybeSingle(),
      service.from("creative_strategy").select("data").eq("project_id", projectId).eq("version", 1).maybeSingle(),
      service.from("visual_dna").select("data").eq("project_id", projectId).eq("version", 1).maybeSingle(),
    ]);

  const brief = (briefRow?.data ?? null) as BriefExtraction | null;
  const strategy = (strategyRow?.data ?? null) as CreativeStrategy | null;
  const dna = (dnaRow?.data ?? null) as VisualDNA | null;
  if (!brief || !strategy) throw new Error("Brief and strategy are required.");

  // Latest render per space.
  const { data: spaceRows } = await service
    .from("spaces")
    .select("id, name_ar, name_en, requirements")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  const { data: genRows } = await service
    .from("generations")
    .select("space_id, version, asset_id")
    .eq("project_id", projectId)
    .order("version", { ascending: true });

  const latestAssetBySpace = new Map<string, string>();
  for (const g of (genRows ?? []) as {
    space_id: string | null;
    asset_id: string | null;
  }[]) {
    if (g.space_id && g.asset_id) latestAssetBySpace.set(g.space_id, g.asset_id);
  }

  const { data: copy, usage } = await runPresentationCopy(brief, strategy);

  // ── Assemble slides ──────────────────────────────────────────────────────
  const slides: SlideDraft[] = [];
  const add = (section: string, content: Record<string, unknown>, asset_ids: string[] = []) =>
    slides.push({ section, content, asset_ids });

  add("cover", {
    layout: "cover",
    title: project.title,
    subtitle: copy.cover_subtitle,
    client: project.client,
  });
  add("understanding", { layout: "text", heading: "فهم الفعالية", body: copy.understanding });
  add("big_idea", {
    layout: "text",
    heading: "الفكرة الكبرى",
    subheading: strategy.big_idea.title,
    body: strategy.big_idea.statement,
  });
  if (strategy.creative_narrative) {
    add("narrative", { layout: "text", heading: "السرد الإبداعي", body: strategy.creative_narrative });
  }
  if (strategy.guest_journey?.length) {
    add("journey", { layout: "journey", heading: "رحلة الضيف", steps: strategy.guest_journey });
  }
  if (dna) {
    add("visual_language", {
      layout: "visual",
      heading: "اللغة البصرية",
      colors: dna.color_palette ?? [],
      keywords: dna.architectural_keywords ?? [],
      materials: (dna.material_palette ?? []).map((m) => m.name),
    });
  }
  for (const s of (spaceRows ?? []) as {
    id: string;
    name_ar: string | null;
    name_en: string | null;
    requirements: { text?: string } | null;
  }[]) {
    const assetId = latestAssetBySpace.get(s.id);
    if (!assetId) continue; // only spaces with a render
    add(
      "space",
      {
        layout: "gallery",
        heading: s.name_ar ?? s.name_en,
        caption: s.requirements?.text ?? "",
      },
      [assetId],
    );
  }
  add("closing", { layout: "closing", heading: "الختام", body: copy.closing });

  // ── Persist (replace any previous deck) ─────────────────────────────────
  await service.from("presentations").delete().eq("project_id", projectId);
  const { data: pres, error: presError } = await service
    .from("presentations")
    .insert({
      project_id: projectId,
      version: 1,
      status: "draft",
      structure: { sections: slides.map((s) => s.section) },
    })
    .select("id")
    .single();
  if (presError || !pres) throw new Error(presError?.message ?? "Insert failed.");
  const presentationId = (pres as { id: string }).id;

  const slideRows = slides.map((s, i) => ({
    presentation_id: presentationId,
    section: s.section,
    sort_order: i,
    content: s.content as Record<string, unknown>,
    asset_ids: s.asset_ids.length ? s.asset_ids : null,
  }));
  const { error: slideError } = await service.from("presentation_slides").insert(slideRows);
  if (slideError) throw new Error(slideError.message);

  await service
    .from("gates")
    .upsert(
      { project_id: projectId, gate_key: "G7B", status: "pending" },
      { onConflict: "project_id,gate_key" },
    );

  await service.from("agent_runs").insert({
    project_id: projectId,
    agent: "presentation",
    model: "claude",
    tokens_in: usage.inputTokens,
    tokens_out: usage.outputTokens,
    status: "succeeded",
  });

  await service
    .from("projects")
    .update({ status: "presentation_ready" })
    .eq("id", projectId);
}
