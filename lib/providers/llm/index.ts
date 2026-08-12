import "server-only";
import type { LLMProvider } from "@/lib/providers/llm/types";
import { AnthropicLLMProvider } from "@/lib/providers/llm/anthropic";

/**
 * LLM-provider registry. Claude is the only registered provider in V1; the
 * indirection exists so agents depend on the interface, not the vendor.
 */
const factories: Record<string, () => LLMProvider> = {
  anthropic: () => new AnthropicLLMProvider(),
};

const cache = new Map<string, LLMProvider>();

export function getLLMProvider(id = "anthropic"): LLMProvider {
  const cached = cache.get(id);
  if (cached) return cached;

  const factory = factories[id];
  if (!factory) {
    throw new Error(`Unknown LLM provider "${id}".`);
  }
  const provider = factory();
  cache.set(id, provider);
  return provider;
}

export { MODELS } from "@/lib/providers/llm/types";
export type { LLMProvider } from "@/lib/providers/llm/types";
