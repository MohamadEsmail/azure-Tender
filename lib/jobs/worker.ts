import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/db/supabase-server";
import { handleExtract } from "@/lib/jobs/handlers/extract";
import { handleStrategy } from "@/lib/jobs/handlers/strategy";
import type { JobType } from "@/lib/jobs/types";

interface ClaimedJob {
  id: string;
  project_id: string;
  type: JobType;
  payload: Record<string, unknown>;
}

/** Map of job type → handler. New job types register here as modules land. */
const HANDLERS: Partial<
  Record<JobType, (service: SupabaseClient, job: ClaimedJob) => Promise<void>>
> = {
  extract: handleExtract,
  strategy: handleStrategy,
};

/**
 * Run one worker tick: claim and process queued jobs until the queue is empty
 * or the per-tick cap is reached. Called by cron and by the best-effort kick
 * after enqueue. Uses the service client (bypasses RLS) — it is only reachable
 * behind the worker secret.
 */
export async function runWorkerTick(maxJobs = 5): Promise<{
  processed: number;
  results: { id: string; type: JobType; ok: boolean; error?: string }[];
}> {
  const service = createSupabaseServiceClient();
  const results: { id: string; type: JobType; ok: boolean; error?: string }[] = [];

  for (let i = 0; i < maxJobs; i++) {
    const { data: job, error } = await service.rpc("claim_next_job");
    if (error) throw new Error(error.message);
    if (!job) break; // queue empty

    const claimed = job as ClaimedJob;
    const handler = HANDLERS[claimed.type];

    if (!handler) {
      await failJob(service, claimed.id, `No handler for job type ${claimed.type}.`);
      results.push({ id: claimed.id, type: claimed.type, ok: false, error: "no handler" });
      continue;
    }

    try {
      await handler(service, claimed);
      await service
        .from("jobs")
        .update({ status: "succeeded", progress: 100, finished_at: new Date().toISOString() })
        .eq("id", claimed.id);
      results.push({ id: claimed.id, type: claimed.type, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await failJob(service, claimed.id, message);
      results.push({ id: claimed.id, type: claimed.type, ok: false, error: message });
    }
  }

  return { processed: results.length, results };
}

async function failJob(service: SupabaseClient, id: string, message: string) {
  await service
    .from("jobs")
    .update({ status: "failed", error: message.slice(0, 2000), finished_at: new Date().toISOString() })
    .eq("id", id);
}
