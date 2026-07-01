import type {
  TrustedSourceDefinition,
  TrustedSourceRegistry,
} from "@/lib/types/sources";
import type { EntityId } from "@/lib/types/common";
import { trustedSources } from "./trusted-source-registry";

export class MockTrustedSourceRegistry implements TrustedSourceRegistry {
  private sources: TrustedSourceDefinition[];

  constructor(seed: TrustedSourceDefinition[] = trustedSources) {
    this.sources = [...seed];
  }

  async list(): Promise<TrustedSourceDefinition[]> {
    return [...this.sources];
  }

  async getById(id: EntityId): Promise<TrustedSourceDefinition | null> {
    return this.sources.find((source) => source.id === id) ?? null;
  }

  async getByName(name: string): Promise<TrustedSourceDefinition | null> {
    return (
      this.sources.find(
        (source) => source.name.toLowerCase() === name.toLowerCase(),
      ) ?? null
    );
  }

  async getEnabled(): Promise<TrustedSourceDefinition[]> {
    return this.sources.filter((source) => source.enabled);
  }
}

export const trustedSourceRegistry = new MockTrustedSourceRegistry();
