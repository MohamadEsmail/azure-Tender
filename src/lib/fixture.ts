// Phase 1 has no extraction job. Instead we load the real extracted tender from
// samples/alain-g242026.json as a fixture and derive a plausible set of
// confidence flags, so the review screen renders end-to-end exactly as it will
// once the extractor exists.

import sample from "../../samples/alain-g242026.json";
import { allFieldPaths } from "./field-map";
import type { Confidence, FlagStatus, TenderData } from "./types";

export const fixtureData = sample as unknown as TenderData;

// Fields the fixture deliberately marks amber to exercise the confirm flow.
const AMBER_PATHS = new Set<string>([
  "meta.contract_model",
  "meta.start_trigger",
  "meta.subcontract_cap_pct",
  "scope_summary.national_initiative",
  "technical_exclusion_below_pct",
]);

export interface SeedFlag {
  field_path: string;
  confidence: Confidence;
  source_page: number | null;
  status: FlagStatus;
}

/**
 * Deterministic seed flags for the fixture. Amber fields need confirmation,
 * everything else is high-confidence green. Source pages are assigned in field
 * order so clicking a field has a page to jump to.
 */
export function seedFlags(): SeedFlag[] {
  return allFieldPaths().map((path, i) => {
    const amber = AMBER_PATHS.has(path);
    return {
      field_path: path,
      confidence: amber ? "amber" : "green",
      source_page: (i % 8) + 1,
      status: amber ? "unconfirmed" : "confirmed",
    };
  });
}

/**
 * The inputs the tender cannot supply — these are the genuine red items a human
 * must provide (past projects, CVs, pricing …). They map to the red concept and
 * become the missing-data task list.
 */
export function requiredInputs(): string[] {
  return (fixtureData.inputs_required_from_azure as string[] | undefined) ?? [];
}

/** One red flag per required input — these are genuinely missing until filled. */
export function seedInputFlags(): SeedFlag[] {
  return requiredInputs().map((_, i) => ({
    field_path: `inputs_required_from_azure[${i}]`,
    confidence: "red" as const,
    source_page: null,
    status: "missing" as const,
  }));
}
