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
 * Magnific (formerly Freepik) image provider, via the Mystic text-to-image
 * endpoint. Uses the API credits included in the account's Magnific plan.
 *
 * Reference-guided generation uses Mystic's `style_reference` (aesthetic
 * influence), so a space render inherits the locked Visual DNA's look. Mystic
 * takes references as base64, so a reference URL is fetched and encoded here.
 *
 * Generation is asynchronous: POST returns a task id, then we poll until the
 * task completes and returns the image URL(s).
 */

const BASE_URL = "https://api.magnific.com";
const MYSTIC = "/v1/ai/mystic";

const ASPECT_MAP: Record<AspectRatio, string> = {
  "1:1": "square_1_1",
  "16:9": "widescreen_16_9",
  "9:16": "social_story_9_16",
  "4:3": "classic_4_3",
  "3:4": "traditional_3_4",
  "3:2": "standard_3_2",
  "2:3": "portrait_2_3",
};

const capabilities: ImageProviderCapabilities = {
  imageToImage: true,
  maxReferenceImages: 1,
  maxResolution: [4096, 4096],
  supportsSeed: false,
  supportsNegativePrompt: false,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch reference image (${res.status}).`);
  return Buffer.from(await res.arrayBuffer()).toString("base64");
}

export class MagnificImageProvider implements ImageProvider {
  readonly id = "magnific";
  readonly capabilities = capabilities;

  async generate(req: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const key = serverEnv.magnificApiKey();
    const headers = {
      "x-magnific-api-key": key,
      "Content-Type": "application/json",
    };

    const body: Record<string, unknown> = {
      prompt: req.prompt,
      resolution: "2k",
      aspect_ratio: ASPECT_MAP[req.aspectRatio ?? "16:9"],
      model: req.model ?? "realism",
      ...(req.extra ?? {}),
    };

    const reference = req.referenceImages?.[0];
    if (reference) {
      body.style_reference = await fetchAsBase64(reference);
      body.adherence = body.adherence ?? 55;
    }

    // Create the async task.
    const createRes = await fetch(`${BASE_URL}${MYSTIC}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!createRes.ok) {
      throw new Error(
        `Magnific create failed (${createRes.status}): ${await safeText(createRes)}`,
      );
    }
    const created = (await createRes.json()) as {
      data?: { task_id?: string; status?: string };
    };
    const taskId = created.data?.task_id;
    if (!taskId) throw new Error("Magnific did not return a task_id.");

    // Poll until completion (~3 min ceiling).
    for (let attempt = 0; attempt < 60; attempt++) {
      await sleep(3000);
      const pollRes = await fetch(`${BASE_URL}${MYSTIC}/${taskId}`, { headers });
      if (!pollRes.ok) continue;
      const poll = (await pollRes.json()) as {
        data?: { status?: string; generated?: string[] };
      };
      const status = poll.data?.status;
      if (status === "COMPLETED") {
        const imageUrl = poll.data?.generated?.[0];
        if (!imageUrl) throw new Error("Magnific completed without an image.");
        return {
          imageUrl,
          providerJobId: taskId,
          settings: { endpoint: MYSTIC, ...body, style_reference: undefined },
          raw: poll,
        };
      }
      if (status === "FAILED") {
        throw new Error("Magnific reported the generation FAILED.");
      }
    }
    throw new Error("Magnific generation timed out.");
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return "";
  }
}
