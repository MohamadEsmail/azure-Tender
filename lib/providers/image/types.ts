/**
 * Image-provider abstraction.
 *
 * The platform is never hard-coded to one image engine (Higgsfield today;
 * Gemini/Flux/ComfyUI/others later). Every engine implements this one interface,
 * so swapping or adding a provider is a registry change, not a refactor.
 *
 * Consistency is enforced upstream: the Prompt Engineer composes the prompt from
 * the locked Visual DNA, and reference images (the canonical render) are passed
 * through `referenceImages` so image-to-image keeps the event's visual family.
 */

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3";

export interface ImageGenerationRequest {
  /** Fully composed prompt (already merged with Visual DNA by the Prompt Engineer). */
  prompt: string;
  /** Styles/elements to avoid — sourced from Visual DNA `forbidden_styles`. */
  negativePrompt?: string;
  aspectRatio?: AspectRatio;
  /**
   * Canonical/reference image URLs. When present, the provider runs
   * image-to-image so the output inherits the reference's visual DNA.
   */
  referenceImages?: string[];
  /** Fixed seed for reproducibility across a project's renders. */
  seed?: number;
  /** Optional provider-specific model slug override. */
  model?: string;
  /** Escape hatch for provider-specific settings; recorded in metadata. */
  extra?: Record<string, unknown>;
}

export interface ImageGenerationResult {
  /** Full-resolution image URL returned by the provider. */
  imageUrl: string;
  /** Thumbnail/preview URL when the provider supplies one. */
  previewUrl?: string;
  /** Provider's own job/generation id, for traceability. */
  providerJobId?: string;
  /** Effective settings actually used (seed, model, etc.) — stored on the row. */
  settings: Record<string, unknown>;
  /** Raw provider payload, retained for debugging/audit. */
  raw: unknown;
}

export interface ImageProviderCapabilities {
  /** Supports image-to-image / reference-guided generation. */
  imageToImage: boolean;
  /** Max number of reference images accepted (0 if none). */
  maxReferenceImages: number;
  /** Max output resolution [width, height]. */
  maxResolution: [number, number];
  supportsSeed: boolean;
  supportsNegativePrompt: boolean;
}

export interface ImageProvider {
  readonly id: string;
  readonly capabilities: ImageProviderCapabilities;
  /** Run a generation. Throws on failure so the job can be retried. */
  generate(req: ImageGenerationRequest): Promise<ImageGenerationResult>;
}
