import type { BrainOrchestrator, BrainServices } from "@/lib/types/brain";
import type { ExecutiveBriefOutput } from "@/lib/types/executive";
import { createGenerateBriefAction } from "@/lib/ai/generate-brief-action";
import { createBrainServices } from "./create-brain-services";

export class MockBrainOrchestrator implements BrainOrchestrator {
  services: BrainServices;

  constructor(services: BrainServices = createBrainServices()) {
    this.services = services;
  }

  async generateDailyBrief(): Promise<ExecutiveBriefOutput> {
    return this.generateBrief();
  }

  async generateBrief(): Promise<ExecutiveBriefOutput> {
    return createGenerateBriefAction(this.services).execute();
  }
}

export const brainOrchestrator = new MockBrainOrchestrator(createBrainServices());

export { createBrainServices, brainServices } from "./create-brain-services";
