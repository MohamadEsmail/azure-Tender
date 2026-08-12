import "server-only";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import type { CreativeStrategy } from "@/lib/agents/creative-strategist";

export interface StrategyState {
  briefApproved: boolean;
  strategy: CreativeStrategy | null;
  strategyStatus: string | null;
  job: { status: string; error: string | null } | null;
}

export async function getStrategyState(
  projectId: string,
): Promise<StrategyState | null> {
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const { data: g1 } = await supabase
    .from("gates")
    .select("status")
    .eq("project_id", projectId)
    .eq("gate_key", "G1")
    .maybeSingle();

  const { data: strategyRow } = await supabase
    .from("creative_strategy")
    .select("data, status")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();

  const { data: job } = await supabase
    .from("jobs")
    .select("status, error")
    .eq("project_id", projectId)
    .eq("type", "strategy")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    briefApproved: (g1 as { status?: string } | null)?.status === "approved",
    strategy: (strategyRow?.data ?? null) as CreativeStrategy | null,
    strategyStatus: (strategyRow as { status?: string } | null)?.status ?? null,
    job: (job as StrategyState["job"]) ?? null,
  };
}
