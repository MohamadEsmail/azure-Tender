import "server-only";
import { serverEnv } from "@/lib/env";
import type { ImageProvider } from "@/lib/providers/image/types";
import { HiggsfieldImageProvider } from "@/lib/providers/image/higgsfield";
import { MagnificImageProvider } from "@/lib/providers/image/magnific";

/**
 * Image-provider registry. New engines register here; the rest of the app only
 * ever asks for a provider by id and programs against the ImageProvider
 * interface. Instances are created lazily and cached per process.
 */
const factories: Record<string, () => ImageProvider> = {
  magnific: () => new MagnificImageProvider(),
  higgsfield: () => new HiggsfieldImageProvider(),
};

const cache = new Map<string, ImageProvider>();

export function getImageProvider(id?: string): ImageProvider {
  const providerId = id ?? serverEnv.defaultImageProvider();
  const cached = cache.get(providerId);
  if (cached) return cached;

  const factory = factories[providerId];
  if (!factory) {
    throw new Error(
      `Unknown image provider "${providerId}". Registered: ${Object.keys(
        factories,
      ).join(", ")}.`,
    );
  }
  const provider = factory();
  cache.set(providerId, provider);
  return provider;
}

export function listImageProviders(): string[] {
  return Object.keys(factories);
}

export type { ImageProvider } from "@/lib/providers/image/types";
