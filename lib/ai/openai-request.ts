import type OpenAI from "openai";
import { assertAiBudgetAvailable } from "./budget";
import { recordAiUsage } from "./usage-tracker";
import { getOpenAIClient, getOpenAIModel } from "./openai-client";

const DEFAULT_TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 3;

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("429") ||
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("fetch failed")
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ChatCompletionOptions {
  userId?: string | null;
  feature: string;
  model?: string;
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  temperature?: number;
  responseFormat?: OpenAI.Chat.Completions.ChatCompletionCreateParams["response_format"];
  timeoutMs?: number;
}

export async function createChatCompletion(
  options: ChatCompletionOptions,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  if (options.userId) {
    await assertAiBudgetAvailable(options.userId);
  }

  const client = getOpenAIClient();
  const model = options.model ?? getOpenAIModel();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const started = Date.now();
    try {
      const response = await client.chat.completions.create(
        {
          model,
          temperature: options.temperature ?? 0.2,
          messages: options.messages,
          response_format: options.responseFormat,
        },
        { signal: AbortSignal.timeout(timeoutMs) },
      );

      void recordAiUsage({
        userId: options.userId ?? null,
        feature: options.feature,
        model,
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        estimatedCostUsd: 0,
        responseTimeMs: Date.now() - started,
      });

      return response;
    } catch (error) {
      lastError = error;
      void recordAiUsage({
        userId: options.userId ?? null,
        feature: options.feature,
        model,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: 0,
        responseTimeMs: Date.now() - started,
        error: true,
      });

      if (attempt >= MAX_ATTEMPTS || !isRetryableError(error)) {
        throw error;
      }

      await sleep(250 * 2 ** (attempt - 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenAI request failed.");
}
