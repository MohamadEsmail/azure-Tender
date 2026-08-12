import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { downloadObject } from "@/lib/storage";
import { runBriefExtraction } from "@/lib/agents/brief-analyst";
import type { LLMContentBlock } from "@/lib/providers/llm/types";

interface JobRow {
  id: string;
  project_id: string;
  payload: Record<string, unknown>;
}

interface FileRow {
  id: string;
  path: string;
  mime: string | null;
  kind: string;
}

const IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

/**
 * Extract handler: turns the project's uploaded brief files into the structured
 * Brief Intelligence Report, then writes brief_data + field_flags, opens gate
 * G1, and moves the project to awaiting_data.
 */
export async function handleExtract(
  service: SupabaseClient,
  job: JobRow,
): Promise<void> {
  const projectId = job.project_id;

  const { data: files } = await service
    .from("project_files")
    .select("id, path, mime, kind")
    .eq("project_id", projectId)
    .eq("kind", "brief");

  const briefFiles = (files ?? []) as FileRow[];
  if (briefFiles.length === 0) {
    throw new Error("No brief files uploaded for this project.");
  }

  const blocks: LLMContentBlock[] = [];
  const unsupported: string[] = [];

  for (const file of briefFiles) {
    const bytes = await downloadObject(file.path);
    const mime = file.mime ?? "";

    if (mime === "application/pdf") {
      blocks.push({
        type: "document",
        mediaType: "application/pdf",
        dataBase64: toBase64(bytes),
      });
    } else if (IMAGE_MIMES.has(mime)) {
      blocks.push({
        type: "image",
        mediaType: mime === "image/jpg" ? "image/jpeg" : mime,
        dataBase64: toBase64(bytes),
      });
    } else if (mime.startsWith("text/") || mime === "application/json") {
      const text = new TextDecoder().decode(bytes);
      blocks.push({ type: "text", text: `ملف: ${file.path}\n\n${text}` });
    } else {
      unsupported.push(file.path);
    }
  }

  if (blocks.length === 0) {
    throw new Error(
      "No readable brief files. PDF, images, and text are supported; " +
        "convert Word/PowerPoint to PDF first. Skipped: " +
        unsupported.join(", "),
    );
  }

  const { data: extraction, usage } = await runBriefExtraction({ blocks });

  // 1) Store the full report in the single jsonb column (version 1).
  const { error: briefError } = await service.from("brief_data").upsert(
    {
      project_id: projectId,
      version: 1,
      data: {
        ...extraction,
        unsupported_files: unsupported,
      },
    },
    { onConflict: "project_id,version" },
  );
  if (briefError) throw new Error(briefError.message);

  // 2) Populate the flag index (green/amber/red + source page).
  if (extraction.fields.length > 0) {
    const flagRows = extraction.fields.map((f) => ({
      project_id: projectId,
      field_path: f.field_path,
      confidence: f.confidence,
      source_page: f.source_page,
      status: f.confidence === "green" ? "confirmed" : "unconfirmed",
    }));
    const { error: flagError } = await service
      .from("field_flags")
      .upsert(flagRows, { onConflict: "project_id,field_path" });
    if (flagError) throw new Error(flagError.message);
  }

  // 3) Open the "brief understood" gate (G1) for human sign-off.
  await service
    .from("gates")
    .upsert(
      { project_id: projectId, gate_key: "G1", status: "pending" },
      { onConflict: "project_id,gate_key" },
    );

  // 4) Record the agent run for cost/audit.
  await service.from("agent_runs").insert({
    project_id: projectId,
    agent: "brief_analyst",
    model: "claude",
    tokens_in: usage.inputTokens,
    tokens_out: usage.outputTokens,
    status: "succeeded",
  });

  // 5) There will almost always be red fields — move to awaiting_data.
  await service
    .from("projects")
    .update({ status: "awaiting_data" })
    .eq("id", projectId);
}
