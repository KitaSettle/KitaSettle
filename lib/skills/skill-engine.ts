import type {
  SkillDefinition,
  SkillEngine,
  SkillExecutionRequest,
  SkillExecutionResult,
} from "@/lib/types/skills";
import type { EntityId } from "@/lib/types/common";
import { nowIso } from "@/lib/utils";
import { skillRegistry } from "./skill-registry";

export class MockSkillEngine implements SkillEngine {
  private skills: SkillDefinition[];

  constructor(seed: SkillDefinition[] = skillRegistry) {
    this.skills = [...seed];
  }

  async listSkills(): Promise<SkillDefinition[]> {
    return [...this.skills];
  }

  async getSkill(id: EntityId): Promise<SkillDefinition | null> {
    return this.skills.find((skill) => skill.id === id) ?? null;
  }

  async getEnabledSkills(): Promise<SkillDefinition[]> {
    return this.skills.filter((skill) => skill.enabled);
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
        message: `Mock execution complete for ${skill.name}. Real execution will be wired in a later sprint.`,
        inputReceived: request.input,
      },
      executedAt: nowIso(),
      mock: true,
    };
  }
}

export const skillEngine = new MockSkillEngine();
