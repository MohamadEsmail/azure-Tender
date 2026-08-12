import "server-only";
import { getLLMProvider, MODELS } from "@/lib/providers/llm";
import type { BriefExtraction } from "@/lib/agents/brief-analyst";
import type { CreativeStrategy } from "@/lib/agents/creative-strategist";

/**
 * Presentation agent — writes the connective copy for the proposal deck. Most
 * slides reuse already-approved artifacts (strategy, journey, renders); this
 * agent supplies the polished prose that frames them: the cover tagline, the
 * "event understanding" summary, and the closing. Arabic, on-brand.
 */

export interface PresentationCopy {
  cover_subtitle: string;
  understanding: string;
  closing: string;
}

const SCHEMA = {
  type: "object",
  properties: {
    cover_subtitle: { type: "string", description: "سطر تعريفي موجز تحت العنوان" },
    understanding: {
      type: "string",
      description: "فقرة قصيرة تلخّص فهمنا للفعالية وأهدافها (٢-٤ جمل)",
    },
    closing: { type: "string", description: "خاتمة قصيرة ودعوة للمضي قدمًا" },
  },
  required: ["cover_subtitle", "understanding", "closing"],
} as const;

const SYSTEM_PROMPT = `You are writing the connective copy for a professional event proposal deck from an elite experiential design studio. Given the brief and strategy, write three short Arabic pieces: a cover subtitle, an "event understanding" summary, and a closing. Confident, elegant, specific to this event — never generic filler. Return via the tool.`;

export async function runPresentationCopy(
  brief: BriefExtraction,
  strategy: CreativeStrategy,
): Promise<{ data: PresentationCopy; usage: { inputTokens: number; outputTokens: number } }> {
  const llm = getLLMProvider();
  const context = JSON.stringify(
    { summary: brief.summary_ar, big_idea: strategy.big_idea },
    null,
    2,
  );

  const result = await llm.extractStructured<PresentationCopy>({
    system: SYSTEM_PROMPT,
    schema: SCHEMA as unknown as Record<string, unknown>,
    schemaName: "presentation_copy",
    model: MODELS.routine,
    maxTokens: 3000,
    messages: [
      {
        role: "user",
        content: "اكتب نصوص العرض التقديمي بناءً على:\n\n" + context,
      },
    ],
  });

  return { data: result.data, usage: result.usage };
}
