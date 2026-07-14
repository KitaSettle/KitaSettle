import { isOpenAIConfigured } from "@/lib/config/env";
import { prepareAiUserContent } from "@/lib/security/sanitize";
import { getOpenAIClient, getOpenAIModel } from "./openai-client";

// Kept low and worst-case-bounded (2 * 12s + backoff ~= 24s) so this never
// outruns a serverless function's own time limit -- a route-level maxDuration
// is only a backstop if OpenAI itself is slow, not if this retries past it.
const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 2;

export interface HardenedChatRequest {
  systemPrompt: string;
  userPrompt: string;
  source?: string;
  json?: boolean;
  fallback: string;
  timeoutMs?: number;
}

export interface HardenedChatResult {
  content: string;
  usedFallback: boolean;
  error?: string;
}

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("timeout") ||
    message.includes("503") ||
    message.includes("502") ||
    message.includes("rate limit") ||
    message.includes("overloaded")
  );
}

async function callOpenAI(
  request: HardenedChatRequest,
  signal: AbortSignal,
): Promise<string> {
  const client = getOpenAIClient();
  const { content: sanitizedUser } = prepareAiUserContent(
    request.source ?? "hardened-chat",
    request.userPrompt,
  );

  const response = await client.chat.completions.create(
    {
      model: getOpenAIModel(),
      temperature: 0.4,
      response_format: request.json ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: sanitizedUser },
      ],
    },
    { signal },
  );

  return response.choices[0]?.message?.content?.trim() ?? "";
}

export async function createHardenedChatCompletion(
  request: HardenedChatRequest,
): Promise<HardenedChatResult> {
  if (!isOpenAIConfigured()) {
    return { content: request.fallback, usedFallback: true, error: "OpenAI not configured" };
  }

  const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const content = await callOpenAI(request, controller.signal);
      clearTimeout(timer);
      if (content) {
        return { content, usedFallback: false };
      }
      lastError = new Error("Empty AI response");
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      console.error("[KitaSettle] Hardened chat attempt failed:", {
        attempt,
        source: request.source,
        error,
      });
      if (!isRetryableError(error) || attempt === MAX_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  return {
    content: request.fallback,
    usedFallback: true,
    error: lastError instanceof Error ? lastError.message : "AI unavailable",
  };
}
