"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { enqueueJob, kickWorker } from "@/lib/jobs/queue";

/** Enqueue Visual DNA generation. Requires the moodboard gate (G3B) approved. */
export async function generateVisualDna(projectId: string): Promise<void> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: g3b } = await supabase
    .from("gates")
    .select("status")
    .eq("project_id", projectId)
    .eq("gate_key", "G3B")
    .maybeSingle();
  if ((g3b as { status?: string } | null)?.status !== "approved") return;

  await enqueueJob(projectId, "visual_dna");
  kickWorker();
  revalidatePath(`/projects/${projectId}/visual-dna`);
}

/**
 * Approve and LOCK gate G4B (Visual DNA). Once locked, every subsequent space
 * render references this Visual DNA version — the consistency guarantee.
 */
export async function lockVisualDna(projectId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("visual_dna")
    .update({ status: "approved" })
    .eq("project_id", projectId)
    .eq("version", 1);

  await supabase.from("gates").upsert(
    {
      project_id: projectId,
      gate_key: "G4B",
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
    to_state: "visual_dna_locked",
    meta: { gate: "G4B" },
  });

  revalidatePath(`/projects/${projectId}/visual-dna`);
}
