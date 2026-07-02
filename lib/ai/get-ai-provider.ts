import type { AIProvider } from "./AIProvider";
import { getAIProviderMode, isOpenAIConfigured, type AIProviderMode } from "@/lib/config/env";
import { MockAIProvider, mockAIProvider } from "./MockAIProvider";
import { OpenAIProvider, openAIProvider } from "./OpenAIProvider";

export type { AIProviderMode };

export { getAIProviderMode };

export function getAIProvider(): AIProvider {
  return isOpenAIConfigured() ? openAIProvider : mockAIProvider;
}

export { MockAIProvider, mockAIProvider, OpenAIProvider, openAIProvider };
