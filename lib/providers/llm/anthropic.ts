import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env";
import {
  MODELS,
  type LLMProvider,
  type LLMCompleteRequest,
  type LLMCompleteResult,
  type LLMStructuredRequest,
  type LLMStructuredResult,
  type LLMMessage,
} from "@/lib/providers/llm/types";

/**
 * Anthropic (Claude) provider. Handles plain completions and schema-constrained
 * structured extraction (via a single forced tool call). Multimodal blocks —
 * images and PDFs — are supported so the same call can read a scanned Arabic
 * tender document.
 */
export class AnthropicLLMProvider implements LLMProvider {
  readonly id = "anthropic";
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: serverEnv.anthropicApiKey() });
  }

  async complete(req: LLMCompleteRequest): Promise<LLMCompleteResult> {
    const message = await this.client.messages.create({
      model: req.model ?? MODELS.routine,
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature,
      system: req.system,
      messages: toAnthropicMessages(req.messages),
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return {
      text,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
      raw: message,
    };
  }

  async extractStructured<T>(
    req: LLMStructuredRequest,
  ): Promise<LLMStructuredResult<T>> {
    const toolName = req.schemaName;

    const message = await this.client.messages.create({
      model: req.model ?? MODELS.routine,
      max_tokens: req.maxTokens ?? 8192,
      system: req.system,
      messages: toAnthropicMessages(req.messages),
      tools: [
        {
          name: toolName,
          description:
            "Return the extracted result as a single structured object " +
            "matching the schema. Do not invent values; use null/flags where " +
            "the source does not supply a value.",
          input_schema: req.schema as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: toolName },
    });

    const toolUse = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (!toolUse) {
      throw new Error(
        `Model did not return a "${toolName}" tool call as required.`,
      );
    }

    return {
      data: toolUse.input as T,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
      raw: message,
    };
  }
}

function toAnthropicMessages(
  messages: LLMMessage[],
): Anthropic.MessageParam[] {
  return messages.map((m) => {
    if (typeof m.content === "string") {
      return { role: m.role, content: m.content };
    }
    const blocks: Anthropic.ContentBlockParam[] = m.content.map((block) => {
      if (block.type === "text") {
        return { type: "text", text: block.text };
      }
      if (block.type === "image") {
        return {
          type: "image",
          source: {
            type: "base64",
            media_type: block.mediaType as Anthropic.Base64ImageSource["media_type"],
            data: block.dataBase64,
          },
        };
      }
      // document (PDF)
      return {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: block.dataBase64,
        },
      };
    });
    return { role: m.role, content: blocks };
  });
}
