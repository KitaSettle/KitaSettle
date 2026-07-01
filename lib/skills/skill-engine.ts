import type {
  SkillDefinition,
  SkillEngine,
  SkillExecutionRequest,
  SkillExecutionResult,
} from "@/lib/types/skills";
import type { EntityId } from "@/lib/types/common";
import { nowIso } from "@/lib/utils";
import type { SkillRepository } from "@/lib/repositories/skill-repository";
import type { Repositories } from "@/lib/repositories";
import { getScriptRepositories } from "@/lib/repositories/script";

export class SupabaseSkillEngine implements SkillEngine {
  constructor(
    private repository: SkillRepository,
    private userId: string,
  ) {}

  listSkills(): Promise<SkillDefinition[]> {
    return this.repository.listSkills(this.userId);
  }

  getSkill(id: EntityId): Promise<SkillDefinition | null> {
    return this.repository.getSkill(this.userId, id);
  }

  getEnabledSkills(): Promise<SkillDefinition[]> {
    return this.repository.getEnabledSkills(this.userId);
  }

  async execute(request: SkillExecutionRequest): Promise<SkillExecutionResult> {
    const skill = await this.getSkill(request.skillId);

    if (!skill) {
      throw new Error(`Skill not found: ${request.skillId}`);
    }

    if (!skill.enabled) {
      throw new Error(`Skill is disabled: ${skill.name}`);
    }

    return {
      skillId: skill.id,
      output: {
        skill: skill.name,
        message: `Skill ${skill.name} registered. AI execution will be wired in a later sprint.`,
        inputReceived: request.input,
      },
      executedAt: nowIso(),
      mock: true,
    };
  }
}

export async function createSkillEngine(
  userId: string,
  repos?: Repositories,
): Promise<SupabaseSkillEngine> {
  const repositories = repos ?? getScriptRepositories();
  return new SupabaseSkillEngine(repositories.skills, userId);
}
