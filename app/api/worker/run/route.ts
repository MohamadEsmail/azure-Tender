import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { runWorkerTick } from "@/lib/jobs/worker";

// Needs the Node runtime (Buffer, model SDKs); not Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Background worker tick. Drive it from a cron job (e.g. a cPanel cron hitting
 * this URL every minute) and from the best-effort kick after a job is enqueued.
 * Guarded by a shared secret; never exposed to user sessions (excluded from the
 * auth middleware matcher).
 */
async function handle(request: NextRequest) {
  const secret =
    request.headers.get("x-worker-secret") ??
    new URL(request.url).searchParams.get("secret");

  if (!secret || secret !== serverEnv.workerSecret()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runWorkerTick();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

// GET is allowed so simple cron services that only issue GETs can drive it.
export async function GET(request: NextRequest) {
  return handle(request);
}
