import type { KnowledgeEngine } from "./knowledge";
import type { MemoryEngine } from "./memory";
import type { SkillEngine } from "./skills";
import type { TrustedSourceRegistry } from "./sources";
import type { ResearchQueueService } from "./research";
import type { ExecutiveBriefGenerator } from "./executive";
import type { CrawlerService } from "./crawler";
import type { BrainProviders } from "@/lib/providers/types";

export interface BrainServices {
  knowledge: KnowledgeEngine;
  memory: MemoryEngine;
  skills: SkillEngine;
  sources: TrustedSourceRegistry;
  researchQueue: ResearchQueueService;
  briefGenerator: ExecutiveBriefGenerator;
  crawler: CrawlerService;
  providers: BrainProviders;
}

export interface BrainOrchestrator {
  services: BrainServices;
  generateDailyBrief(): Promise<import("./executive").ExecutiveBriefOutput>;
  generateBrief(): Promise<import("./executive").ExecutiveBriefOutput>;
}
