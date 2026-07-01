import type { BrainProviders, ProviderRegistry } from "./types";
import { mockAIProvider } from "@/lib/ai/MockAIProvider";
import {
  mockCrawlerProvider,
  mockEmbeddingProvider,
  mockMemoryProvider,
  mockSearchProvider,
} from "./mock";

export function createDefaultProviders(): BrainProviders {
  return {
    ai: mockAIProvider,
    search: mockSearchProvider,
    crawler: mockCrawlerProvider,
    embedding: mockEmbeddingProvider,
    memory: mockMemoryProvider,
  };
}

export class DefaultProviderRegistry implements ProviderRegistry {
  providers: BrainProviders;

  constructor(providers: BrainProviders = createDefaultProviders()) {
    this.providers = providers;
  }

  register<K extends keyof BrainProviders>(key: K, provider: BrainProviders[K]): void {
    this.providers[key] = provider;
  }

  get<K extends keyof BrainProviders>(key: K): BrainProviders[K] {
    return this.providers[key];
  }
}

export const providerRegistry = new DefaultProviderRegistry();
