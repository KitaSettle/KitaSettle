import type { BrainServices } from "@/lib/types/brain";
import { createDefaultProviders } from "@/lib/providers";
import { knowledgeEngine } from "@/lib/knowledge";
import { memoryEngine } from "@/lib/memory";
import { skillEngine } from "@/lib/skills";
import { trustedSourceRegistry } from "./source-registry-service";
import { researchQueueService } from "./research-queue-service";
import { executiveBriefGenerator } from "@/lib/executive/brief-generator";
import { crawlerService } from "@/lib/crawler/crawler-service";

export function createBrainServices(overrides?: Partial<BrainServices>): BrainServices {
  return {
    knowledge: knowledgeEngine,
    memory: memoryEngine,
    skills: skillEngine,
    sources: trustedSourceRegistry,
    researchQueue: researchQueueService,
    briefGenerator: executiveBriefGenerator,
    crawler: crawlerService,
    providers: createDefaultProviders(),
    ...overrides,
  };
}

export const brainServices = createBrainServices();
