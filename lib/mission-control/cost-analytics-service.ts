import type { AnalyticsRepository } from "@/lib/repositories/analytics-repository";
import type { AiAnalyticsSection, FinancialSection, AiRoiSection } from "@/lib/types/mission-control";

export class CostAnalyticsService {
  constructor(private analytics: AnalyticsRepository) {}

  async buildAiAnalytics(activeUsers: number): Promise<AiAnalyticsSection> {
    const usage = await this.analytics.getAiUsageAggregates();

    const hasUsageData = usage.monthCost > 0 || usage.requests > 0;
    const monthCost = hasUsageData ? usage.monthCost : 0;
    const todayCost = usage.todayCost > 0 ? usage.todayCost : 0;

    const topUser = usage.byUser.sort((a, b) => b.cost - a.cost)[0];
    const topFeature = usage.byFeature.sort((a, b) => b.cost - a.cost)[0];

    return {
      todayAiCostUsd: Math.round(todayCost * 100) / 100,
      monthlyAiCostUsd: Math.round(monthCost * 100) / 100,
      averageCostPerUserUsd:
        activeUsers > 0 ? Math.round((monthCost / activeUsers) * 100) / 100 : 0,
      averageCostPerBriefUsd:
        usage.briefCount > 0 ? Math.round((monthCost * 0.4 / usage.briefCount) * 100) / 100 : 0,
      averageCostPerIntakeUsd:
        usage.intakeCount > 0 ? Math.round((monthCost * 0.15 / usage.intakeCount) * 100) / 100 : 0,
      mostExpensiveUser: topUser?.email ?? topUser?.userId ?? null,
      mostExpensiveFeature: topFeature?.feature ?? null,
      aiRequests: usage.requests,
      aiRequestsAvoided: usage.cacheHits,
      cacheHitRate:
        usage.totalCalls > 0 ? Math.round((usage.cacheHits / usage.totalCalls) * 100) : 0,
      averageResponseTimeMs: usage.avgResponseMs,
      aiErrors: usage.errors,
    };
  }

  async buildFinancial(ai: AiAnalyticsSection, activeUsers: number): Promise<FinancialSection> {
    const estimatedRevenue = activeUsers * 49;
    const margin =
      estimatedRevenue > 0
        ? Math.round(((estimatedRevenue - ai.monthlyAiCostUsd) / estimatedRevenue) * 100)
        : 0;

    return {
      estimatedMonthlyCostUsd: ai.monthlyAiCostUsd + activeUsers * 2,
      estimatedMonthlyRevenueUsd: estimatedRevenue,
      aiGrossMargin: margin,
      projectedBurnUsd: Math.max(ai.monthlyAiCostUsd + activeUsers * 2 - estimatedRevenue, 0),
    };
  }

  buildAiRoi(brain: { briefsGenerated: number; giveToKitaUploads: number }): AiRoiSection {
    const minutesPerBrief = 18;
    const minutesPerUpload = 12;
    const totalMinutes =
      brain.briefsGenerated * minutesPerBrief + brain.giveToKitaUploads * minutesPerUpload;

    return {
      estimatedHoursSaved: Math.round(totalMinutes / 60),
      minutesSavedPerBrief: minutesPerBrief,
      minutesSavedPerUpload: minutesPerUpload,
      estimatedProductivityGainPercent: Math.min(35, Math.round(totalMinutes / 60)),
    };
  }
}
