export * from "./base";
export * from "./ai-provider";
export * from "./search-provider";
export * from "./crawler-provider";
export * from "./embedding-provider";
export * from "./memory-provider";

export interface BrainProviders {
  ai: import("./ai-provider").AIProvider;
  search: import("./search-provider").SearchProvider;
  crawler: import("./crawler-provider").CrawlerProvider;
  embedding: import("./embedding-provider").EmbeddingProvider;
  memory: import("./memory-provider").MemoryProvider;
}

export interface ProviderRegistry {
  providers: BrainProviders;
  register<K extends keyof BrainProviders>(key: K, provider: BrainProviders[K]): void;
  get<K extends keyof BrainProviders>(key: K): BrainProviders[K];
}
