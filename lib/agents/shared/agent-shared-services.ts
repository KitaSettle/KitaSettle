import type { BrainServices } from "@/lib/types/brain";
import type { AgentSharedServices } from "../types/agent";

export function createAgentSharedServices(
  services: BrainServices,
): AgentSharedServices {
  return {
    knowledge: services.knowledge,
    memory: services.memory,
    researchQueue: services.researchQueue,
    skills: services.skills,
    ai: services.providers.ai,
  };
}
