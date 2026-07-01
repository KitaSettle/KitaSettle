import type { BrainServices } from "@/lib/types/brain";
import type {
  AgentExecutionContext,
  AgentOrchestrator,
  AgentOrchestratorResult,
  AgentResult,
  ExecutiveAgent,
} from "../types/agent";
import { allAgents } from "../agents";
import { createAgentSharedServices } from "../shared/agent-shared-services";
import { selectAgents } from "./agent-selector";

function mergeKnowledgeUsed(results: AgentResult[]): string[] {
  return [...new Set(results.flatMap((result) => result.knowledgeUsed))];
}

function mergeSourcesUsed(results: AgentResult[]): string[] {
  return [...new Set(results.flatMap((result) => result.sourcesUsed))];
}

export class MultiAgentOrchestrator implements AgentOrchestrator {
  private agents: ExecutiveAgent[];
  private services: BrainServices;

  constructor(services: BrainServices, agents: ExecutiveAgent[] = allAgents) {
    this.services = services;
    this.agents = agents;
  }

  listAgents(): ExecutiveAgent[] {
    return [...this.agents];
  }

  async execute(objective: string): Promise<AgentOrchestratorResult> {
    const startedAt = Date.now();
    const sharedServices = createAgentSharedServices(this.services);
    const selectedAgents = selectAgents(objective, this.agents);
    const priorResults: AgentResult[] = [];

    for (const agent of selectedAgents) {
      const context: AgentExecutionContext = {
        objective,
        services: sharedServices,
        priorResults: [...priorResults],
      };

      const result = await agent.execute(context);
      priorResults.push(result);
    }

    const finalResult = priorResults[priorResults.length - 1];

    return {
      objective,
      executionOrder: selectedAgents.map((agent) => agent.name),
      knowledgeUsed: mergeKnowledgeUsed(priorResults),
      sourcesUsed: mergeSourcesUsed(priorResults),
      summary: finalResult?.summary ?? "No agent response generated.",
      agentResults: priorResults,
      executionTimeMs: Date.now() - startedAt,
    };
  }
}

export function createAgentOrchestrator(services: BrainServices): MultiAgentOrchestrator {
  return new MultiAgentOrchestrator(services);
}
