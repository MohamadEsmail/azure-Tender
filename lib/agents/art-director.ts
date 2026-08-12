import "server-only";
import { getLLMProvider, MODELS } from "@/lib/providers/llm";
import type { CreativeStrategy } from "@/lib/agents/creative-strategist";

/**
 * Art Director agent — distils the strategy and moodboard into the Visual DNA:
 * the reusable event design system that every zone must obey. This is the
 * consistency engine. Its `forbidden_styles` and locked reference images are
 * what stop a forty-render dossier from looking like forty different projects.
 *
 * Descriptive fields are Arabic (client-facing). `architectural_keywords` and
 * `forbidden_styles` are English because they feed image-generation prompts,
 * where English terms are more reliable. Colours carry hex codes for swatches.
 */

export interface VisualDNA {
  master_concept: string;
  primary_geometry: string;
  secondary_geometry: string;
  signature_shape: string;
  structural_language: string;
  material_palette: { name: string; description: string }[];
  color_palette: { name: string; hex: string }[];
  lighting_language: string;
  pattern_system: string;
  environmental_graphics: string;
  architectural_keywords: string[];
  forbidden_styles: string[];
  brand_rules: string[];
  // Added by the handler, not the model:
  reference_asset_ids?: string[];
  canonical_asset_id?: string | null;
}

const DNA_SCHEMA = {
  type: "object",
  properties: {
    master_concept: { type: "string", description: "المفهوم البصري الرئيسي بالعربية" },
    primary_geometry: { type: "string" },
    secondary_geometry: { type: "string" },
    signature_shape: { type: "string", description: "الشكل المميّز للفعالية" },
    structural_language: { type: "string" },
    material_palette: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name"],
      },
    },
    color_palette: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "اسم اللون بالعربية" },
          hex: { type: "string", description: "كود اللون مثل #1A2B3C" },
        },
        required: ["name", "hex"],
      },
    },
    lighting_language: { type: "string" },
    pattern_system: { type: "string" },
    environmental_graphics: { type: "string" },
    architectural_keywords: {
      type: "array",
      items: { type: "string" },
      description: "English keywords for image generation prompts.",
    },
    forbidden_styles: {
      type: "array",
      items: { type: "string" },
      description: "English styles/elements to AVOID, to keep every render on-brand.",
    },
    brand_rules: { type: "array", items: { type: "string" } },
  },
  required: [
    "master_concept",
    "primary_geometry",
    "signature_shape",
    "material_palette",
    "color_palette",
    "lighting_language",
    "architectural_keywords",
    "forbidden_styles",
  ],
} as const;

const SYSTEM_PROMPT = `You are the Art Director at a world-class event & experiential design studio. From the creative strategy and the generated moodboard categories, you define the Visual DNA: a single, reusable event design system that EVERY zone of the event must follow, so the whole event reads as one design family.

REQUIREMENTS:
- Derive everything from the strategy's visual language and the moodboard; do not introduce an unrelated direction.
- Be specific and buildable: real geometry, real materials, a real colour palette with hex codes.
- forbidden_styles is critical: name the styles/elements that would break consistency (e.g. "generic sci-fi neon", "cluttered decoration", "flat corporate booth"). English.
- architectural_keywords: concise English terms that will seed image-generation prompts.
- Descriptive/prose fields in Arabic (client-facing); keywords and forbidden_styles in English.

Return the Visual DNA via the structured tool.`;

export async function runVisualDNA(
  strategy: CreativeStrategy,
  moodboardCategories: string[],
): Promise<{ data: VisualDNA; usage: { inputTokens: number; outputTokens: number } }> {
  const llm = getLLMProvider();

  const context = JSON.stringify(
    {
      strategy,
      moodboard_categories: moodboardCategories,
    },
    null,
    2,
  );

  const result = await llm.extractStructured<VisualDNA>({
    system: SYSTEM_PROMPT,
    schema: DNA_SCHEMA as unknown as Record<string, unknown>,
    schemaName: "visual_dna",
    model: MODELS.reasoning,
    maxTokens: 10000,
    messages: [
      {
        role: "user",
        content:
          "استخرج الهوية البصرية (Visual DNA) من الاستراتيجية والموودبورد التاليين:\n\n" +
          context,
      },
    ],
  });

  return { data: result.data, usage: result.usage };
}
