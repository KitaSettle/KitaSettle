import type { BrainServices } from "@/lib/types/brain";
import type { Repositories } from "@/lib/repositories";
import { getServerRepositories } from "@/lib/repositories/server";
import { getScriptRepositories } from "@/lib/repositories/script";
import { createDefaultProviders } from "@/lib/providers";
import { createKnowledgeEngine } from "@/lib/knowledge/knowledge-engine";
import { createMemoryEngine } from "@/lib/memory/memory-engine";
import { createSkillEngine } from "@/lib/skills/skill-engine";
import { createResearchQueueService } from "./research-queue-service";
import { trustedSourceRegistry } from "./source-registry-service";
import { executiveBriefGenerator } from "@/lib/executive/brief-generator";
import { crawlerService } from "@/lib/crawler/crawler-service";

export async function createBrainServices(
  userId: string,
  overrides?: Partial<BrainServices>,
  options?: { server?: boolean },
): Promise<BrainServices> {
  const repos: Repositories = options?.server
    ? await getServerRepositories()
    : getScriptRepositories();

  const [knowledge, memory, skills, researchQueue] = await Promise.all([
    createKnowledgeEngine(userId, repos),
    createMemoryEngine(userId, repos),
    createSkillEngine(userId, repos),
    createResearchQueueService(userId, repos),
  ]);

  return {
    knowledge,
    memory,
    skills,
    sources: trustedSourceRegistry,
    researchQueue,
    briefGenerator: executiveBriefGenerator,
    crawler: crawlerService,
    providers: createDefaultProviders(),
    ...overrides,
  };
}
