import "server-only";
import { createSupabaseServiceClient } from "@/lib/db/supabase-server";
import { serverEnv } from "@/lib/env";
import type { JobType } from "@/lib/jobs/types";

/** Write a queued job row. The worker picks it up on its next tick. */
export async function enqueueJob(
  projectId: string,
  type: JobType,
  payload: Record<string, unknown> = {},
): Promise<string> {
  const service = createSupabaseServiceClient();
  const { data, error } = await service
    .from("jobs")
    .insert({ project_id: projectId, type, payload, status: "queued" })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to enqueue job.");
  }
  return (data as { id: string }).id;
}

/**
 * Best-effort nudge so a freshly-enqueued job runs without waiting for the next
 * cron tick. Fire-and-forget: failures are ignored because the cron/worker is
 * the source of truth and will process the job regardless.
 */
export function kickWorker(): void {
  const url = `${serverEnv.appUrl()}/api/worker/run`;
  void fetch(url, {
    method: "POST",
    headers: { "x-worker-secret": safeWorkerSecret() },
  }).catch(() => {
    // ignored — cron will process the job
  });
}

function safeWorkerSecret(): string {
  try {
    return serverEnv.workerSecret();
  } catch {
    return "";
  }
}
