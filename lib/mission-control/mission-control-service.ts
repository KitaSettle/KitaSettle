import type { AnalyticsRepository } from "@/lib/repositories/analytics-repository";
import type { MissionControlPayload } from "@/lib/types/mission-control";
import { nowIso } from "@/lib/utils";
import { CostAnalyticsService } from "./cost-analytics-service";

export class MissionControlService {
  private costAnalytics: CostAnalyticsService;

  constructor(private analytics: AnalyticsRepository) {
    this.costAnalytics = new CostAnalyticsService(analytics);
  }

  async getDashboard(): Promise<MissionControlPayload> {
    const [
      executiveSummary,
      executiveBrain,
      security,
      infrastructure,
      feedbackHub,
      errorCenter,
      betaManagement,
    ] = await Promise.all([
      this.analytics.getExecutiveSummary(),
      this.analytics.getExecutiveBrainMetrics(),
      this.analytics.getSecurityMetrics(),
      this.analytics.getInfrastructureMetrics(),
      this.analytics.getFeedbackSummary(),
      this.analytics.getErrorCenterSummary(),
      this.analytics.getBetaManagement(),
    ]);

    const aiAnalytics = await this.costAnalytics.buildAiAnalytics(executiveSummary.activeUsers);
    const financial = await this.costAnalytics.buildFinancial(aiAnalytics, executiveSummary.activeUsers);
    const aiRoi = this.costAnalytics.buildAiRoi(executiveBrain);

    return {
      generatedAt: nowIso(),
      executiveSummary,
      aiAnalytics,
      executiveBrain,
      security,
      infrastructure,
      feedbackHub,
      errorCenter,
      financial,
      aiRoi,
      betaManagement,
    };
  }
}

export function createMissionControlService(analytics: AnalyticsRepository): MissionControlService {
  return new MissionControlService(analytics);
}
