import type { EntityId } from "./common";

export interface SkillDefinition {
  id: EntityId;
  name: string;
  description: string;
  input: string;
  output: string;
  enabled: boolean;
  searchTags?: string[];
}

export interface SkillExecutionRequest {
  skillId: EntityId;
  input: Record<string, unknown>;
}

export interface SkillExecutionResult {
  skillId: EntityId;
  output: Record<string, unknown>;
  executedAt: string;
  mock: true;
}

export interface SkillEngine {
  listSkills(): Promise<SkillDefinition[]>;
  getSkill(id: EntityId): Promise<SkillDefinition | null>;
  getEnabledSkills(): Promise<SkillDefinition[]>;
  execute(request: SkillExecutionRequest): Promise<SkillExecutionResult>;
}
