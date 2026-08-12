"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { PROJECT_FILES_BUCKET, buildObjectPath } from "@/lib/storage";
import { enqueueJob, kickWorker } from "@/lib/jobs/queue";
import type { BriefExtraction } from "@/lib/agents/brief-analyst";
import type { Json } from "@/lib/db/database.types";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per file

export interface UploadState {
  error?: string;
}

/** Upload one or more brief files, then enqueue extraction. */
export async function uploadBriefFiles(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const user = await requireUser();
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return { error: "مشروع غير معروف." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "اختر ملفًا واحدًا على الأقل." };

  const supabase = await createSupabaseServerClient();

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return { error: `الملف ${file.name} أكبر من الحد المسموح (25MB).` };
    }
    const fileId = randomUUID();
    const path = buildObjectPath(projectId, fileId, file.name);

    const { error: uploadError } = await supabase.storage
      .from(PROJECT_FILES_BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (uploadError) return { error: `تعذّر رفع ${file.name}: ${uploadError.message}` };

    const { error: rowError } = await supabase.from("project_files").insert({
      id: fileId,
      project_id: projectId,
      path,
      kind: "brief",
      mime: file.type || null,
      size: file.size,
      uploaded_by: user.id,
    });
    if (rowError) return { error: rowError.message };
  }

  await supabase.from("projects").update({ status: "extracting" }).eq("id", projectId);

  await enqueueJob(projectId, "extract");
  kickWorker();

  revalidatePath(`/projects/${projectId}/brief`);
  return {};
}

/**
 * Confirm or fill a single extracted field. Human input is authoritative:
 * confirming an amber field or filling a red one marks it green/confirmed.
 * Rewrites the field inside brief_data.data and syncs its field_flags row.
 */
export async function updateField(formData: FormData): Promise<void> {
  await requireUser();
  const projectId = String(formData.get("project_id") ?? "");
  const fieldPath = String(formData.get("field_path") ?? "");
  const value = String(formData.get("value") ?? "");
  if (!projectId || !fieldPath) return;

  const supabase = await createSupabaseServerClient();

  const { data: briefRow } = await supabase
    .from("brief_data")
    .select("data")
    .eq("project_id", projectId)
    .eq("version", 1)
    .maybeSingle();

  const data = ((briefRow as { data?: BriefExtraction } | null)?.data ??
    null) as BriefExtraction | null;
  if (!data) return;

  const field = data.fields.find((f) => f.field_path === fieldPath);
  if (!field) return;

  const wasRed = field.confidence === "red";
  field.value = value;
  field.confidence = "green"; // human-verified
  field.note = field.note || (wasRed ? "أُدخل يدويًا" : "مؤكَّد");

  await supabase
    .from("brief_data")
    .update({ data: data as unknown as Json })
    .eq("project_id", projectId)
    .eq("version", 1);

  await supabase.from("field_flags").upsert(
    {
      project_id: projectId,
      field_path: fieldPath,
      confidence: "green",
      source_page: field.source_page,
      status: wasRed ? "filled" : "confirmed",
    },
    { onConflict: "project_id,field_path" },
  );

  revalidatePath(`/projects/${projectId}/brief`);
}

/** Approve gate G1 (brief understood) and advance the project. */
export async function approveBriefUnderstanding(projectId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("gates")
    .upsert(
      {
        project_id: projectId,
        gate_key: "G1",
        status: "approved",
        decided_by: user.id,
        decided_at: new Date().toISOString(),
      },
      { onConflict: "project_id,gate_key" },
    );

  await supabase.from("projects").update({ status: "brief_approved" }).eq("id", projectId);
  await supabase.from("audit_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: "gate_approved",
    to_state: "brief_approved",
    meta: { gate: "G1" },
  });

  revalidatePath(`/projects/${projectId}/brief`);
}
