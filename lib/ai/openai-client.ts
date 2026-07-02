import OpenAI from "openai";
import { env, isOpenAIConfigured } from "@/lib/config/env";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!isOpenAIConfigured()) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: env.openaiApiKey });
  }

  return cachedClient;
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}
