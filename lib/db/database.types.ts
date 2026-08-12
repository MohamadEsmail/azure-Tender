/**
 * Database types.
 *
 * This is a hand-authored stand-in so the Supabase clients are generically
 * typed at the foundation stage. It is meant to be REPLACED by the real
 * generated file once the Supabase project exists:
 *
 *   supabase gen types typescript --project-id <id> > lib/db/database.types.ts
 *
 * (or the Supabase MCP `generate_typescript_types`). Until then, table rows are
 * loosely typed; the enum unions below match migration 0001 exactly and are
 * safe to rely on.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "admin" | "staff" | "client";
export type ProjectType = "tender" | "pitch" | "hybrid";
export type ProjectStatus =
  | "draft"
  | "extracting"
  | "awaiting_data"
  | "brief_approved"
  | "in_strategy"
  | "in_outline"
  | "in_moodboard"
  | "in_visual_dna"
  | "in_spatial"
  | "in_visualization"
  | "in_review"
  | "in_revision"
  | "approved"
  | "presentation_ready"
  | "delivered";
export type ProjectRole =
  | "creative_director"
  | "art_director"
  | "designer_3d"
  | "graphic_designer"
  | "project_manager"
  | "lead"
  | "approver"
  | "member"
  | "viewer"
  | "client_viewer";
export type ConfidenceLevel = "green" | "amber" | "red";
export type FieldStatus = "unconfirmed" | "confirmed" | "filled";
export type GateStatus = "pending" | "approved" | "rejected";
export type ArtifactStatus =
  | "draft"
  | "internal_review"
  | "revision_required"
  | "approved"
  | "client_review"
  | "client_revision"
  | "final";

type GenericTable = {
  Row: Record<string, Json>;
  Insert: Record<string, Json | undefined>;
  Update: Record<string, Json | undefined>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: { [tableName: string]: GenericTable };
    Views: { [viewName: string]: { Row: Record<string, Json> } };
    Functions: { [fnName: string]: { Args: Record<string, Json>; Returns: Json } };
    Enums: {
      app_role: AppRole;
      project_type: ProjectType;
      project_status: ProjectStatus;
      project_role: ProjectRole;
      confidence_level: ConfidenceLevel;
      field_status: FieldStatus;
      gate_status: GateStatus;
      artifact_status: ArtifactStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
