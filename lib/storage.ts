import "server-only";
import { createSupabaseServiceClient } from "@/lib/db/supabase-server";

export const PROJECT_FILES_BUCKET = "project-files";

/** Object path convention: "<projectId>/<fileId>-<sanitized name>". */
export function buildObjectPath(
  projectId: string,
  fileId: string,
  fileName: string,
): string {
  const safe = fileName.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(-120);
  return `${projectId}/${fileId}-${safe}`;
}

/**
 * A short-lived signed URL for a private object. Government tender files are
 * confidential — nothing is ever served from a public bucket, only via these
 * time-limited links.
 */
export async function createSignedUrl(
  path: string,
  expiresInSeconds = 60 * 30,
): Promise<string> {
  const service = createSupabaseServiceClient();
  const { data, error } = await service.storage
    .from(PROJECT_FILES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to sign URL.");
  }
  return data.signedUrl;
}

/** Download an object as bytes (used by the worker to feed the extractor). */
export async function downloadObject(path: string): Promise<Uint8Array> {
  const service = createSupabaseServiceClient();
  const { data, error } = await service.storage
    .from(PROJECT_FILES_BUCKET)
    .download(path);
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to download object.");
  }
  return new Uint8Array(await data.arrayBuffer());
}
