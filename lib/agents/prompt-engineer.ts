import "server-only";
import type { CreativeStrategy } from "@/lib/agents/creative-strategist";
import type { VisualDNA } from "@/lib/agents/art-director";
import type { AspectRatio } from "@/lib/providers/image/types";

/**
 * Prompt Engineer — turns approved creative direction into generation prompts.
 *
 * For the moodboard, it fans the single visual language out across the standard
 * moodboard categories, so every image shares the same DNA (mood, materials,
 * lighting, colour) but explores a different facet. This deterministic
 * composition is what keeps a moodboard coherent instead of six unrelated
 * pictures.
 */

export interface MoodboardPromptSpec {
  category: string;
  category_ar: string;
  prompt: string;
  aspectRatio: AspectRatio;
  seed: number;
}

const CATEGORIES: { key: string; ar: string; focus: string }[] = [
  { key: "architecture", ar: "العمارة والبنية", focus: "architectural forms, structural language, signature geometry of an event environment" },
  { key: "materials", ar: "الخامات والملمس", focus: "close-up material and texture study: surfaces, finishes, fabrication materials" },
  { key: "lighting", ar: "الإضاءة", focus: "lighting mood study: how light shapes the space, fixtures, glow, shadow" },
  { key: "color", ar: "الألوان", focus: "colour palette study for the environment, dominant and accent tones in context" },
  { key: "atmosphere", ar: "الأجواء المكانية", focus: "wide spatial atmosphere of the event environment, ambience and scale" },
  { key: "technology", ar: "التقنية والوسائط", focus: "digital and technology integration: LED, projection, interactive media in the space" },
];

const QUALITY =
  "professional event and experiential design moodboard reference, architectural visualization, cinematic, highly detailed, photorealistic, no text, no watermark, no logos";

function base(strategy: CreativeStrategy): string {
  const v = strategy.visual_language;
  return [
    strategy.big_idea.title,
    v.mood,
    v.atmosphere,
    `materials: ${v.materials}`,
    `lighting: ${v.lighting_direction}`,
    `colours: ${v.color_direction}`,
    (v.keywords ?? []).join(", "),
  ]
    .filter(Boolean)
    .join(". ");
}

export function buildMoodboardPrompts(
  strategy: CreativeStrategy,
): MoodboardPromptSpec[] {
  const dna = base(strategy);
  return CATEGORIES.map((c, i) => ({
    category: c.key,
    category_ar: c.ar,
    prompt: `${dna}. Focus: ${c.focus}. ${QUALITY}.`,
    aspectRatio: "16:9" as AspectRatio,
    // Stable, distinct seed per category → reproducible moodboard.
    seed: 4200 + i,
  }));
}

const RENDER_QUALITY =
  "professional event 3D architectural visualization, photorealistic render, cinematic wide-angle, volumetric lighting, high detail, no text, no watermark, no logos";

/** Compose a fixed slice of the Visual DNA that every space render must carry. */
function dnaClause(dna: VisualDNA): string {
  const keywords = (dna.architectural_keywords ?? []).join(", ");
  const materials = (dna.material_palette ?? []).map((m) => m.name).join(", ");
  const colors = (dna.color_palette ?? []).map((c) => c.name).join(", ");
  return [
    dna.master_concept,
    keywords ? `architectural style: ${keywords}` : "",
    dna.signature_shape ? `signature shape: ${dna.signature_shape}` : "",
    materials ? `materials: ${materials}` : "",
    colors ? `colours: ${colors}` : "",
    dna.lighting_language ? `lighting: ${dna.lighting_language}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

/** Build a space-render prompt from the locked Visual DNA + the space spec. */
export function buildSpacePrompt(
  dna: VisualDNA,
  space: { name_en: string; name_ar: string; requirements: string },
): string {
  const forbidden = (dna.forbidden_styles ?? []).join(", ");
  return (
    `${space.name_en} — an event zone. ${dnaClause(dna)}. ` +
    `Requirements: ${space.requirements}. ${RENDER_QUALITY}.` +
    (forbidden ? ` Avoid: ${forbidden}.` : "")
  );
}

/**
 * Build a revision prompt: keep the base render intact and apply only the
 * requested change, while still honouring the Visual DNA.
 */
export function buildRevisionPrompt(
  dna: VisualDNA,
  basePrompt: string,
  instruction: string,
): string {
  const forbidden = (dna.forbidden_styles ?? []).join(", ");
  return (
    `${basePrompt}\n\nApply ONLY this change while preserving everything else: ${instruction}.` +
    (forbidden ? ` Continue to avoid: ${forbidden}.` : "")
  );
}
