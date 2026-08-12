"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { enqueueJob, kickWorker } from "@/lib/jobs/queue";

async function gateApproved(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  gateKey: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("gates")
    .select("status")
    .eq("project_id", projectId)
    .eq("gate_key", gateKey)
    .maybeSingle();
  return (data as { status?: string } | null)?.status === "approved";
}

/** Identify the event spaces. Requires the Visual DNA gate (G4B) locked. */
export async function generateSpacePlan(projectId: string): Promise<void> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  if (!(await gateApproved(supabase, projectId, "G4B"))) return;

  await enqueueJob(projectId, "space_plan");
  kickWorker();
  revalidatePath(`/projects/${projectId}/spaces`);
}

/** Approve gate G5B (space plan approved). */
export async function approveSpacePlan(projectId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  await supabase.from("gates").upsert(
    {
      project_id: projectId,
      gate_key: "G5B",
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
    to_state: "space_plan_approved",
    meta: { gate: "G5B" },
  });
  revalidatePath(`/projects/${projectId}/spaces`);
}

/** Generate a 3D render for one space (seeded from the locked Visual DNA). */
export async function generateSpaceRender(
  projectId: string,
  spaceId: string,
): Promise<void> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  if (!(await gateApproved(supabase, projectId, "G4B"))) return;

  await enqueueJob(projectId, "image_generate", { spaceId });
  kickWorker();
  revalidatePath(`/projects/${projectId}/spaces`);
}

/** Revise an existing render with a natural-language instruction. */
export async function reviseSpaceRender(
  projectId: string,
  generationId: string,
  instruction: string,
): Promise<void> {
  await requireUser();
  const text = instruction.trim();
  if (!text) return;

  await enqueueJob(projectId, "image_revise", { generationId, instruction: text });
  kickWorker();
  revalidatePath(`/projects/${projectId}/spaces`);
}

/** Approve gate G6B (visuals approved). */
export async function approveVisuals(projectId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  await supabase.from("gates").upsert(
    {
      project_id: projectId,
      gate_key: "G6B",
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
    to_state: "visuals_approved",
    meta: { gate: "G6B" },
  });
  revalidatePath(`/projects/${projectId}/spaces`);
}
