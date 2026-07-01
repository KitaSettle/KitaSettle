import type { BrainOrchestrator, BrainServices } from "@/lib/types/brain";
import type { ExecutiveBriefOutput } from "@/lib/types/executive";
import { createGenerateBriefAction } from "@/lib/ai/generate-brief-action";
import { createBrainServices } from "./create-brain-services";

export class BrainOrchestratorImpl implements BrainOrchestrator {
  services: BrainServices;
  private userId: string;

  constructor(userId: string, services?: BrainServices) {
    this.userId = userId;
    this.services = services as BrainServices;
  }

  static async create(userId: string): Promise<BrainOrchestratorImpl> {
    const services = await createBrainServices(userId);
    return new BrainOrchestratorImpl(userId, services);
  }

  async generateDailyBrief(): Promise<ExecutiveBriefOutput> {
    return this.generateBrief();
  }

  async generateBrief(): Promise<ExecutiveBriefOutput> {
    return createGenerateBriefAction(this.services, this.userId).execute();
  }
}

export async function createBrainOrchestrator(
  userId: string,
  options?: { server?: boolean },
): Promise<BrainOrchestratorImpl> {
  const services = await createBrainServices(userId, undefined, options);
  return new BrainOrchestratorImpl(userId, services);
}
