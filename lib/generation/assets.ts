import "server-only";
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PROJECT_ASSETS_BUCKET } from "@/lib/storage";

/**
 * Download a provider-generated image from its (usually short-lived) URL and
 * persist it as an immutable, content-addressed asset in private storage. The
 * provider URL expires; our stored copy is the record of truth.
 *
 * Returns the new asset id, so callers can link it from moodboard_items /
 * generations rows.
 */
export async function persistImageFromUrl(
  service: SupabaseClient,
  opts: {
    projectId: string;
    kind: string; // "moodboard" | "space_render" | ...
    url: string;
    jobId?: string;
  },
): Promise<{ assetId: string; path: string }> {
  const res = await fetch(opts.url);
  if (!res.ok) {
    throw new Error(`Failed to download generated image (${res.status}).`);
  }
  const contentType = res.headers.get("content-type") ?? "image/png";
  const ext = contentType.includes("jpeg") ? "jpg" : "png";
  const bytes = new Uint8Array(await res.arrayBuffer());

  const assetId = randomUUID();
  const path = `${opts.projectId}/${opts.kind}/${assetId}.${ext}`;

  const { error: uploadError } = await service.storage
    .from(PROJECT_ASSETS_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { error: rowError } = await service.from("assets").insert({
    id: assetId,
    project_id: opts.projectId,
    storage_path: path,
    mime: contentType,
    created_by_job: opts.jobId ?? null,
  });
  if (rowError) throw new Error(rowError.message);

  return { assetId, path };
}
