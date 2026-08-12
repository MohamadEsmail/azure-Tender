/**
 * LLM-provider abstraction.
 *
 * Claude (Anthropic) is the V1 reasoning engine per CLAUDE.md — extraction,
 * strategy, prompt engineering, QA. This seam exists so a second provider can
 * be added later without rewriting the agents; it is not a reason to build
 * multi-provider support now.
 */

export interface LLMMessage {
  role: "user" | "assistant";
  /** Text, or content blocks for multimodal (e.g. document/image extraction). */
  content: string | LLMContentBlock[];
}

export type LLMContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; dataBase64: string }
  | { type: "document"; mediaType: string; dataBase64: string };

export interface LLMCompleteRequest {
  system?: string;
  messages: LLMMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMCompleteResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
  raw: unknown;
}

/**
 * Structured extraction: the model is forced to return an object matching a
 * JSON schema (via tool use). Malformed output is the provider's problem to
 * retry, so callers receive a typed object, not a string to parse. This is how
 * agents avoid free-text drift and how the anti-fabrication rules are enforced
 * (missing values become explicit nulls/flags, never invented).
 */
export interface LLMStructuredRequest {
  system?: string;
  messages: LLMMessage[];
  /** JSON Schema describing the required output shape. */
  schema: Record<string, unknown>;
  /** Human-readable name for the output tool, e.g. "brief_intelligence". */
  schemaName: string;
  model?: string;
  maxTokens?: number;
}

export interface LLMStructuredResult<T> {
  data: T;
  usage: { inputTokens: number; outputTokens: number };
  raw: unknown;
}

export interface LLMProvider {
  readonly id: string;
  complete(req: LLMCompleteRequest): Promise<LLMCompleteResult>;
  extractStructured<T>(
    req: LLMStructuredRequest,
  ): Promise<LLMStructuredResult<T>>;
}

/** Default model tiers — overridable per call. */
export const MODELS = {
  /** Hardest reasoning: strategy, creative critique, difficult extraction. */
  reasoning: "claude-opus-5",
  /** Routine structured work: clean extraction, prompt engineering, QA. */
  routine: "claude-sonnet-5",
} as const;
