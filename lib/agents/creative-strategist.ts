import "server-only";
import { getLLMProvider, MODELS } from "@/lib/providers/llm";
import type { BriefExtraction } from "@/lib/agents/brief-analyst";

/**
 * Creative Strategist agent — turns the approved brief into the event's creative
 * strategy. This is the first step of the creative methodology: never jump from
 * brief to visuals; establish the idea and narrative first.
 *
 * The output must not be generic. Every decision states WHY it exists and how it
 * connects to the brief. Content is Arabic-first (it is the deliverable), with
 * UAE/KSA cultural sensitivity and government-appropriateness where relevant.
 */

export interface StrategyPoint {
  statement: string;
  rationale: string;
}

export interface CreativeStrategy {
  big_idea: { title: string; statement: string; rationale: string };
  event_concept: StrategyPoint;
  creative_narrative: string;
  storytelling_direction: string;
  guest_journey: { stage: string; description: string }[];
  experience_philosophy: string;
  design_principles: { name: string; description: string }[];
  visual_language: {
    mood: string;
    atmosphere: string;
    materials: string;
    lighting_direction: string;
    color_direction: string;
    keywords: string[];
  };
  technology_integration: string;
  cultural_references: string;
  sustainability: string;
  innovation: string;
}

const STRATEGY_SCHEMA = {
  type: "object",
  properties: {
    big_idea: {
      type: "object",
      properties: {
        title: { type: "string", description: "اسم قصير جذّاب للفكرة الكبرى" },
        statement: { type: "string" },
        rationale: { type: "string", description: "لماذا هذه الفكرة وكيف ترتبط بالبريف" },
      },
      required: ["title", "statement", "rationale"],
    },
    event_concept: pointSchema("مفهوم الفعالية"),
    creative_narrative: { type: "string" },
    storytelling_direction: { type: "string" },
    guest_journey: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stage: { type: "string" },
          description: { type: "string" },
        },
        required: ["stage", "description"],
      },
    },
    experience_philosophy: { type: "string" },
    design_principles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "description"],
      },
    },
    visual_language: {
      type: "object",
      properties: {
        mood: { type: "string" },
        atmosphere: { type: "string" },
        materials: { type: "string" },
        lighting_direction: { type: "string" },
        color_direction: { type: "string" },
        keywords: { type: "array", items: { type: "string" } },
      },
      required: ["mood", "atmosphere", "materials", "lighting_direction", "color_direction"],
    },
    technology_integration: { type: "string" },
    cultural_references: { type: "string" },
    sustainability: { type: "string" },
    innovation: { type: "string" },
  },
  required: [
    "big_idea",
    "event_concept",
    "creative_narrative",
    "guest_journey",
    "design_principles",
    "visual_language",
  ],
} as const;

function pointSchema(label: string) {
  return {
    type: "object",
    description: label,
    properties: {
      statement: { type: "string" },
      rationale: { type: "string" },
    },
    required: ["statement", "rationale"],
  };
}

const SYSTEM_PROMPT = `You are the Creative Strategist at an internationally-respected event & experiential design studio working in the UAE and Saudi Arabia. Given an approved brief, you develop the overall creative strategy for the event.

REQUIREMENTS:
- The concept must NOT be generic. It should feel like the work of a world-class studio.
- Every decision must explain WHY it exists and how it connects to the brief (the rationale fields).
- Respect UAE/KSA culture; be appropriate for government/municipal audiences when the brief indicates them.
- Ground everything in the brief's objectives, audience, venue, and constraints. Do not contradict the brief.
- Where the brief is silent, you may make a creative choice, but keep it defensible and tied to the brief's intent.
- All content is in Arabic (it is the client-facing deliverable). Keep it vivid but precise.

Return the strategy via the structured tool.`;

export async function runCreativeStrategy(
  brief: BriefExtraction,
  meta: { title: string; client: string | null; project_type: string },
): Promise<{
  data: CreativeStrategy;
  usage: { inputTokens: number; outputTokens: number };
}> {
  const llm = getLLMProvider();

  const briefText = JSON.stringify(
    { project: meta, brief_intelligence: brief },
    null,
    2,
  );

  const result = await llm.extractStructured<CreativeStrategy>({
    system: SYSTEM_PROMPT,
    schema: STRATEGY_SCHEMA as unknown as Record<string, unknown>,
    schemaName: "creative_strategy",
    model: MODELS.reasoning,
    maxTokens: 12000,
    messages: [
      {
        role: "user",
        content:
          "طوّر الاستراتيجية الإبداعية لهذه الفعالية بناءً على تقرير ذكاء البريف التالي. اربط كل قرار بالبريف.\n\n" +
          briefText,
      },
    ],
  });

  return { data: result.data, usage: result.usage };
}
