// Shared domain types. The extracted tender itself is loosely typed (jsonb) —
// see TenderData — because tender shapes vary enormously between clients.

export type UserRole = "admin" | "lead" | "member" | "approver" | "viewer";

export type TenderStatus =
  | "draft"
  | "extracting"
  | "awaiting_data"
  | "ready"
  | "generating"
  | "in_review"
  | "approved"
  | "submitted";

export type Confidence = "green" | "amber" | "red";
export type FlagStatus = "unconfirmed" | "confirmed" | "missing";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
}

export interface Tender {
  id: string;
  title: string;
  client: string | null;
  contract_no: string | null;
  deadline: string | null;
  status: TenderStatus;
  owner_id: string;
  created_at: string;
}

export interface FieldFlag {
  id?: string;
  tender_id: string;
  field_path: string;
  confidence: Confidence;
  source_page: number | null;
  status: FlagStatus;
}

// The extracted record. Deliberately open — the UI renders it via a field map,
// not fixed columns. This interface documents the shape of the sample fixture.
export interface TenderData {
  schema_version?: string;
  meta?: Record<string, unknown>;
  scoring?: Array<Record<string, unknown>>;
  technical_exclusion_below_pct?: number;
  scope_summary?: Record<string, unknown>;
  events?: Array<Record<string, unknown>>;
  sites?: Array<Record<string, unknown>>;
  gates?: Array<Record<string, unknown>>;
  permits?: string[];
  penalties?: Array<Record<string, unknown>>;
  compliance?: string[];
  inputs_required_from_azure?: string[];
  [key: string]: unknown;
}
