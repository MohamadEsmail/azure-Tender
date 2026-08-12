import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runEventArchitect } from "@/lib/agents/event-architect";
import type { BriefExtraction } from "@/lib/agents/brief-analyst";
import type { CreativeStrategy } from "@/lib/agents/creative-strategist";

interface JobRow {
  id: string;
  project_id: string;
  payload: Record<string, unknown>;
}

/** Space-plan handler: identifies the event zones to design from brief+strategy. */
export async function handleSpacePlan(
  service: SupabaseClient,
  job: JobRow,
): Promise<void> {
  const projectId = job.project_id;

  const { data: briefRow } = await service
    .from("brief_data")
    .select("data")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();
  const { data: strategyRow } = await service
    .from("creative_strategy")
    .select("data")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();

  const brief = (briefRow?.data ?? null) as BriefExtraction | null;
  const strategy = (strategyRow?.data ?? null) as CreativeStrategy | null;
  if (!brief || !strategy) throw new Error("Brief and strategy are required.");

  const { data: result, usage } = await runEventArchitect(brief, strategy);

  // Re-plan replaces the previous space list (and its renders, via cascade).
  await service.from("spaces").delete().eq("project_id", projectId);

  const rows = result.spaces.map((s, i) => ({
    project_id: projectId,
    type: s.type,
    name_ar: s.name_ar,
    name_en: s.name_en,
    sort_order: i,
    requirements: { text: s.requirements, rationale: s.rationale },
    status: "draft" as const,
  }));
  if (rows.length > 0) {
    const { error } = await service.from("spaces").insert(rows);
    if (error) throw new Error(error.message);
  }

  await service
    .from("gates")
    .upsert(
      { project_id: projectId, gate_key: "G5B", status: "pending" },
      { onConflict: "project_id,gate_key" },
    );

  await service.from("agent_runs").insert({
    project_id: projectId,
    agent: "event_architect",
    model: "claude",
    tokens_in: usage.inputTokens,
    tokens_out: usage.outputTokens,
    status: "succeeded",
  });

  await service
    .from("projects")
    .update({ status: "in_spatial" })
    .eq("id", projectId);
}
