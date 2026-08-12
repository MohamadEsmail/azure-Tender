import "server-only";
import { getLLMProvider, MODELS } from "@/lib/providers/llm";
import type { BriefExtraction } from "@/lib/agents/brief-analyst";
import type { CreativeStrategy } from "@/lib/agents/creative-strategist";

/**
 * Event Architect agent — determines which event zones must be designed, based
 * on the brief and strategy. Only spaces relevant to THIS event; it may also
 * recommend spaces that would strengthen the experience, each with a rationale.
 */

export interface PlannedSpace {
  type: string; // slug, e.g. "main_stage"
  name_ar: string;
  name_en: string;
  requirements: string; // short Arabic description of what the space must do
  rationale: string; // why this space, tied to the brief
}

const SCHEMA = {
  type: "object",
  properties: {
    spaces: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "lowercase snake_case slug, e.g. main_stage, registration",
          },
          name_ar: { type: "string" },
          name_en: { type: "string" },
          requirements: { type: "string", description: "بالعربية" },
          rationale: { type: "string", description: "لماذا هذه المساحة ومن أين في البريف" },
        },
        required: ["type", "name_ar", "name_en", "requirements", "rationale"],
      },
    },
  },
  required: ["spaces"],
} as const;

const SYSTEM_PROMPT = `You are the Event Architect at a world-class experiential design studio. Given the brief and creative strategy, decide which event zones/spaces need to be designed.

RULES:
- Only include spaces relevant to THIS event. Do not force a fixed list.
- You may recommend additional spaces that would improve the experience, but justify each in the rationale (tied to the brief).
- Order spaces along the guest journey (entrance/registration first, closing last).
- name_ar and requirements in Arabic; type is an English snake_case slug.

Return the list via the structured tool.`;

export async function runEventArchitect(
  brief: BriefExtraction,
  strategy: CreativeStrategy,
): Promise<{
  data: { spaces: PlannedSpace[] };
  usage: { inputTokens: number; outputTokens: number };
}> {
  const llm = getLLMProvider();
  const context = JSON.stringify({ brief, strategy }, null, 2);

  const result = await llm.extractStructured<{ spaces: PlannedSpace[] }>({
    system: SYSTEM_PROMPT,
    schema: SCHEMA as unknown as Record<string, unknown>,
    schemaName: "event_spaces",
    model: MODELS.reasoning,
    maxTokens: 8000,
    messages: [
      {
        role: "user",
        content:
          "حدّد مساحات الفعالية المطلوب تصميمها بناءً على البريف والاستراتيجية:\n\n" +
          context,
      },
    ],
  });

  return { data: result.data, usage: result.usage };
}
