import type { EntityId } from "./common";

export interface TrustedSourceDefinition {
  id: EntityId;
  name: string;
  category: string;
  description: string;
  baseUrl: string;
  enabled: boolean;
  tags: string[];
}

export interface TrustedSourceRegistry {
  list(): Promise<TrustedSourceDefinition[]>;
  getById(id: EntityId): Promise<TrustedSourceDefinition | null>;
  getByName(name: string): Promise<TrustedSourceDefinition | null>;
  getEnabled(): Promise<TrustedSourceDefinition[]>;
}
