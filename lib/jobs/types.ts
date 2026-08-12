/**
 * Background-job vocabulary shared by the worker and the app.
 *
 * The browser never generates; it writes a job row and subscribes for status.
 * Every expensive/slow/provider-specific step is one of these job types, so it
 * can be queued, retried, versioned, and audited uniformly.
 */

export const JOB_TYPES = [
  // Shared core
  "extract", // brief → structured Brief Intelligence Report
  // Track A — proposal
  "outline", // scoring table → document outline
  "block_generate", // one dossier block
  "dossier_render", // dossier → PDF
  // Track B — creative
  "strategy", // creative strategy
  "moodboard", // moodboard generation
  "visual_dna", // build the Visual DNA object
  "space_plan", // zones / guest flow
  "image_generate", // one space render
  "image_revise", // revision of an existing render
  "qa_check", // Creative QA vs Visual DNA
  "presentation_build", // assemble slides
  "presentation_render", // slides → PDF/PPTX
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "failed",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export interface JobRow {
  id: string;
  project_id: string;
  type: JobType;
  status: JobStatus;
  progress: number; // 0..100
  payload: Record<string, unknown>;
  error: string | null;
  attempts: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}
