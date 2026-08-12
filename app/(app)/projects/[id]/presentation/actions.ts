"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { enqueueJob, kickWorker } from "@/lib/jobs/queue";

/** Build the proposal deck. Requires the visuals gate (G6B) approved. */
export async function generatePresentation(projectId: string): Promise<void> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: g6b } = await supabase
    .from("gates")
    .select("status")
    .eq("project_id", projectId)
    .eq("gate_key", "G6B")
    .maybeSingle();
  if ((g6b as { status?: string } | null)?.status !== "approved") return;

  await enqueueJob(projectId, "presentation_build");
  kickWorker();
  revalidatePath(`/projects/${projectId}/presentation`);
}

/** Approve gate G7B (presentation approved) and mark the project delivered. */
export async function approvePresentation(projectId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("presentations")
    .update({ status: "approved" })
    .eq("project_id", projectId)
    .eq("version", 1);

  await supabase.from("gates").upsert(
    {
      project_id: projectId,
      gate_key: "G7B",
      status: "approved",
      decided_by: user.id,
      decided_at: new Date().toISOString(),
    },
    { onConflict: "project_id,gate_key" },
  );

  await supabase.from("projects").update({ status: "delivered" }).eq("id", projectId);
  await supabase.from("audit_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: "gate_approved",
    to_state: "delivered",
    meta: { gate: "G7B" },
  });

  revalidatePath(`/projects/${projectId}/presentation`);
}
