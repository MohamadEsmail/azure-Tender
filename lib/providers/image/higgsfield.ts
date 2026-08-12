import "server-only";
import { serverEnv } from "@/lib/env";
import type {
  ImageProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageProviderCapabilities,
  AspectRatio,
} from "@/lib/providers/image/types";

/**
 * Higgsfield image provider — the platform's first concrete engine.
 *
 * Uses the official `@higgsfield/client` v2 SDK and its Soul text-to-image
 * endpoint (`/v1/text2image/soul`). `subscribe(..., { withPolling: true })`
 * submits the generation and resolves once the async request completes,
 * returning the media URL in `response.images[0].url`.
 *
 * Reference-guided generation (image-to-image) uses Soul's `image_reference`,
 * so a space render can inherit the canonical Visual DNA image. Credentials
 * come from `HF_CREDENTIALS` ("KEY_ID:KEY_SECRET"), server-side only.
 */

const SOUL_ENDPOINT = "/v1/text2image/soul";

// Soul takes an explicit "WIDTHxHEIGHT" string; map our aspect ratios to a
// 1080p-class resolution for each.
const RESOLUTION_BY_RATIO: Record<AspectRatio, string> = {
  "1:1": "1080x1080",
  "16:9": "1920x1080",
  "9:16": "1080x1920",
  "4:3": "1440x1080",
  "3:4": "1080x1440",
  "3:2": "1620x1080",
  "2:3": "1080x1620",
};

let configured = false;

async function getClient() {
  const { higgsfield, config } = await import("@higgsfield/client/v2");
  if (!configured) {
    config({ credentials: serverEnv.higgsfieldCredentials() });
    configured = true;
  }
  return higgsfield;
}

const capabilities: ImageProviderCapabilities = {
  imageToImage: true,
  maxReferenceImages: 1, // Soul accepts one image_reference
  maxResolution: [1920, 1920],
  supportsSeed: true,
  supportsNegativePrompt: false,
};

export class HiggsfieldImageProvider implements ImageProvider {
  readonly id = "higgsfield";
  readonly capabilities = capabilities;

  async generate(req: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const higgsfield = await getClient();
    const endpoint = req.model ?? SOUL_ENDPOINT;

    const reference = req.referenceImages?.[0];

    const input: Record<string, unknown> = {
      prompt: req.prompt,
      width_and_height: RESOLUTION_BY_RATIO[req.aspectRatio ?? "16:9"],
      quality: "1080p",
      batch_size: 1,
      ...(req.seed !== undefined ? { seed: req.seed } : {}),
      ...(reference
        ? { image_reference: { type: "image_url", image_url: reference } }
        : {}),
      ...(req.extra ?? {}),
    };

    const response = await higgsfield.subscribe(endpoint, {
      input,
      withPolling: true,
    });

    if (response.status !== "completed") {
      throw new Error(
        `Higgsfield generation ended with status "${response.status}" ` +
          `(request ${response.request_id}).`,
      );
    }

    const imageUrl = response.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error("Higgsfield returned no image URL.");
    }

    return {
      imageUrl,
      providerJobId: response.request_id,
      settings: { endpoint, ...input },
      raw: response,
    };
  }
}
