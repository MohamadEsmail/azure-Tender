"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { enqueueJob, kickWorker } from "@/lib/jobs/queue";

/** Enqueue creative-strategy generation. Requires the brief gate (G1) approved. */
export async function generateStrategy(projectId: string): Promise<void> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: g1 } = await supabase
    .from("gates")
    .select("status")
    .eq("project_id", projectId)
    .eq("gate_key", "G1")
    .maybeSingle();
  if ((g1 as { status?: string } | null)?.status !== "approved") {
    return; // brief must be approved first
  }

  await enqueueJob(projectId, "strategy");
  kickWorker();
  revalidatePath(`/projects/${projectId}/strategy`);
}

/** Approve gate G2B (strategy approved). */
export async function approveStrategy(projectId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("creative_strategy")
    .update({ status: "approved" })
    .eq("project_id", projectId)
    .eq("version", 1);

  await supabase.from("gates").upsert(
    {
      project_id: projectId,
      gate_key: "G2B",
      status: "approved",
      decided_by: user.id,
      decided_at: new Date().toISOString(),
    },
    { onConflict: "project_id,gate_key" },
  );

  await supabase.from("audit_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: "gate_approved",
    to_state: "strategy_approved",
    meta: { gate: "G2B" },
  });

  revalidatePath(`/projects/${projectId}/strategy`);
}
