"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { enqueueJob, kickWorker } from "@/lib/jobs/queue";

/** Enqueue moodboard generation. Requires the strategy gate (G2B) approved. */
export async function generateMoodboard(projectId: string): Promise<void> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: g2b } = await supabase
    .from("gates")
    .select("status")
    .eq("project_id", projectId)
    .eq("gate_key", "G2B")
    .maybeSingle();
  if ((g2b as { status?: string } | null)?.status !== "approved") return;

  await enqueueJob(projectId, "moodboard");
  kickWorker();
  revalidatePath(`/projects/${projectId}/moodboard`);
}

/** Approve gate G3B (moodboard approved). */
export async function approveMoodboard(projectId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("moodboards")
    .update({ status: "approved" })
    .eq("project_id", projectId)
    .eq("version", 1);

  await supabase.from("gates").upsert(
    {
      project_id: projectId,
      gate_key: "G3B",
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
    to_state: "moodboard_approved",
    meta: { gate: "G3B" },
  });

  revalidatePath(`/projects/${projectId}/moodboard`);
}
