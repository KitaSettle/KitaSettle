import type { KnowledgeEngine } from "@/lib/types/knowledge";
import type { MemoryEngine } from "@/lib/types/memory";
import type { ResearchQueueService } from "@/lib/types/research";
import type { SkillEngine } from "@/lib/types/skills";
import type { AIProvider } from "@/lib/ai/AIProvider";
import type { EntityId } from "@/lib/types/common";

export interface AgentSharedServices {
  knowledge: KnowledgeEngine;
  memory: MemoryEngine;
  researchQueue: ResearchQueueService;
  skills: SkillEngine;
  ai: AIProvider;
}

export interface AgentExecutionContext {
  objective: string;
  services: AgentSharedServices;
  priorResults: AgentResult[];
}

export interface AgentResult {
  agentId: EntityId;
  agentName: string;
  summary: string;
  knowledgeUsed: string[];
  sourcesUsed: string[];
  confidence: number;
  data?: Record<string, unknown>;
}

export interface ExecutiveAgent {
  id: EntityId;
  name: string;
  description: string;
  supportedSkills: string[];
  supportedSources: string[];
  execute(context: AgentExecutionContext): Promise<AgentResult>;
}

export interface AgentOrchestratorResult {
  objective: string;
  executionOrder: string[];
  knowledgeUsed: string[];
  sourcesUsed: string[];
  summary: string;
  agentResults: AgentResult[];
  executionTimeMs: number;
}

export interface AgentOrchestrator {
  listAgents(): ExecutiveAgent[];
  execute(objective: string): Promise<AgentOrchestratorResult>;
}
