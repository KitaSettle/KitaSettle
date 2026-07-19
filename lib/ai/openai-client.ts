import OpenAI from "openai";
import { env, isGlmConfigured, isOpenAIConfigured } from "@/lib/config/env";

let cachedClient: OpenAI | null = null;
let cachedClientKind: "glm" | "openai" | null = null;

// GLM (Zhipu/Z.ai) speaks the OpenAI chat-completions protocol, so the same
// SDK client works for both -- just point it at a different base URL. GLM
// is preferred when configured (cheaper, separate quota from OpenAI).
export function getOpenAIClient(): OpenAI {
  const kind: "glm" | "openai" | null = isGlmConfigured()
    ? "glm"
    : isOpenAIConfigured()
      ? "openai"
      : null;

  if (!kind) {
    throw new Error("No AI provider is configured (set GLM_API_KEY or OPENAI_API_KEY).");
  }

  if (cachedClient && cachedClientKind === kind) return cachedClient;

  cachedClient =
    kind === "glm"
      ? new OpenAI({ apiKey: env.glmApiKey, baseURL: env.glmBaseUrl })
      : new OpenAI({ apiKey: env.openaiApiKey });
  cachedClientKind = kind;

  return cachedClient;
}

export function getOpenAIModel(): string {
  if (isGlmConfigured()) return env.glmModel;
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}
