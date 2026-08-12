import "server-only";
import { getLLMProvider, MODELS } from "@/lib/providers/llm";
import type { LLMContentBlock } from "@/lib/providers/llm/types";
import type { ConfidenceLevel } from "@/lib/db/database.types";

/**
 * Brief Analyst agent — reads an uploaded brief and returns the structured
 * Brief Intelligence Report.
 *
 * Hard rules (CLAUDE.md): the extractor never invents facts. A value that is
 * not in the source document is returned with an empty value and confidence
 * "red" so a human supplies it. Values that are present but ambiguous are
 * "amber" (need confirmation); clearly-stated values are "green". Every field
 * carries the source page it was found on, which powers click-to-source in the
 * review screen.
 */

/** The report sections, mirroring the Brief Analysis Module. */
export const BRIEF_SECTIONS = [
  { key: "event_information", label_ar: "معلومات الفعالية" },
  { key: "objectives", label_ar: "الأهداف" },
  { key: "audience", label_ar: "الجمهور المستهدف" },
  { key: "venue", label_ar: "الموقع" },
  { key: "experience_requirements", label_ar: "متطلبات التجربة" },
  { key: "spatial_requirements", label_ar: "المتطلبات المكانية" },
  { key: "content_requirements", label_ar: "متطلبات المحتوى" },
  { key: "branding_requirements", label_ar: "متطلبات الهوية" },
  { key: "technical_requirements", label_ar: "المتطلبات التقنية" },
  { key: "production_requirements", label_ar: "متطلبات الإنتاج" },
  { key: "deliverables", label_ar: "المخرجات المطلوبة" },
  { key: "constraints", label_ar: "القيود" },
] as const;

export type BriefSectionKey = (typeof BRIEF_SECTIONS)[number]["key"];

export interface BriefField {
  section: BriefSectionKey;
  label_ar: string;
  label_en: string;
  field_path: string;
  value: string;
  confidence: ConfidenceLevel;
  source_page: number | null;
  note: string;
}

export interface BriefExtraction {
  summary_ar: string;
  fields: BriefField[];
  missing_information: { field_path: string; label_ar: string; why_needed: string }[];
  contradictions: { a: string; b: string; note: string }[];
  assumptions: { statement: string; basis: string }[];
  recommendations: string[];
}

const SECTION_KEYS = BRIEF_SECTIONS.map((s) => s.key);

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    summary_ar: {
      type: "string",
      description: "ملخص تنفيذي موجز للبريف بالعربية.",
    },
    fields: {
      type: "array",
      description:
        "Every extracted fact, one per entry. Include entries you could NOT " +
        "find with value '' and confidence 'red'.",
      items: {
        type: "object",
        properties: {
          section: { type: "string", enum: SECTION_KEYS },
          label_ar: { type: "string", description: "اسم الحقل بالعربية" },
          label_en: { type: "string" },
          field_path: {
            type: "string",
            description:
              "Unique dotted key, e.g. 'event_information.event_name'. Stable, " +
              "lowercase, snake_case segments.",
          },
          value: {
            type: "string",
            description: "The extracted value verbatim, or '' if not present.",
          },
          confidence: { type: "string", enum: ["green", "amber", "red"] },
          source_page: {
            type: ["integer", "null"],
            description: "1-based page the value was found on, or null.",
          },
          note: { type: "string", description: "Optional short note." },
        },
        required: ["section", "label_ar", "field_path", "value", "confidence"],
      },
    },
    missing_information: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field_path: { type: "string" },
          label_ar: { type: "string" },
          why_needed: { type: "string" },
        },
        required: ["label_ar", "why_needed"],
      },
    },
    contradictions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          a: { type: "string" },
          b: { type: "string" },
          note: { type: "string" },
        },
        required: ["a", "b"],
      },
    },
    assumptions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          statement: { type: "string" },
          basis: { type: "string" },
        },
        required: ["statement"],
      },
    },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: ["summary_ar", "fields"],
} as const;

const SYSTEM_PROMPT = `You are the Brief Analyst for an events & experiential design studio in the UAE/KSA. You read a client brief, RFP, or government tender (often Arabic, sometimes scanned) and produce a structured Brief Intelligence Report.

STRICT RULES:
- NEVER invent facts. Dates, areas, quantities, attendance, deadlines, penalties, budgets — if a value is not stated in the document, return it with value "" and confidence "red". A human will supply it.
- confidence: "green" = clearly stated; "amber" = present but ambiguous/needs confirmation; "red" = missing.
- Always give source_page (1-based) when a value comes from the document.
- Detect requirements that are implied but not explicitly stated, and record them as assumptions (with their basis), not as facts.
- Note contradictions and missing information explicitly.
- Field labels (label_ar) and the summary must be in Arabic. field_path stays English snake_case.
- Cover all sections that apply; do not force irrelevant sections.

Return everything via the structured tool call.`;

export interface ExtractionInput {
  /** Content blocks already prepared from the uploaded files. */
  blocks: LLMContentBlock[];
}

export async function runBriefExtraction(
  input: ExtractionInput,
): Promise<{ data: BriefExtraction; usage: { inputTokens: number; outputTokens: number } }> {
  const llm = getLLMProvider();

  const content: LLMContentBlock[] = [
    ...input.blocks,
    {
      type: "text",
      text: "استخرج تقرير ذكاء البريف من المستندات المرفقة وفق الأداة المطلوبة. التزم بعدم اختلاق أي معلومة غير موجودة.",
    },
  ];

  const result = await llm.extractStructured<BriefExtraction>({
    system: SYSTEM_PROMPT,
    schema: EXTRACTION_SCHEMA as unknown as Record<string, unknown>,
    schemaName: "brief_intelligence",
    model: MODELS.reasoning,
    maxTokens: 16000,
    messages: [{ role: "user", content }],
  });

  return { data: result.data, usage: result.usage };
}
