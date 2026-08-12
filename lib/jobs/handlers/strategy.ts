import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runCreativeStrategy } from "@/lib/agents/creative-strategist";
import type { BriefExtraction } from "@/lib/agents/brief-analyst";

interface JobRow {
  id: string;
  project_id: string;
  payload: Record<string, unknown>;
}

/**
 * Strategy handler: reads the approved brief and generates the creative
 * strategy, writing it as creative_strategy v1 (status draft, awaiting G2B).
 */
export async function handleStrategy(
  service: SupabaseClient,
  job: JobRow,
): Promise<void> {
  const projectId = job.project_id;

  const { data: project } = await service
    .from("projects")
    .select("title, client, project_type")
    .eq("id", projectId)
    .single();
  if (!project) throw new Error("Project not found.");

  const { data: briefRow } = await service
    .from("brief_data")
    .select("data")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();

  const brief = (briefRow?.data ?? null) as BriefExtraction | null;
  if (!brief) throw new Error("No brief data to build a strategy from.");

  const { data: strategy, usage } = await runCreativeStrategy(brief, {
    title: project.title,
    client: project.client,
    project_type: project.project_type,
  });

  const { error } = await service.from("creative_strategy").upsert(
    {
      project_id: projectId,
      version: 1,
      status: "draft",
      data: strategy as unknown as Record<string, unknown>,
    },
    { onConflict: "project_id,version" },
  );
  if (error) throw new Error(error.message);

  await service
    .from("gates")
    .upsert(
      { project_id: projectId, gate_key: "G2B", status: "pending" },
      { onConflict: "project_id,gate_key" },
    );

  await service.from("agent_runs").insert({
    project_id: projectId,
    agent: "creative_strategist",
    model: "claude",
    tokens_in: usage.inputTokens,
    tokens_out: usage.outputTokens,
    status: "succeeded",
  });

  await service
    .from("projects")
    .update({ status: "in_strategy" })
    .eq("id", projectId);
}
