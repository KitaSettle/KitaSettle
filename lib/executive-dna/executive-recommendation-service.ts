import type { Repositories } from "@/lib/repositories";
import type { ExecutiveDNAProfile, ExecutiveDNARecommendation } from "@/lib/types/executive-dna";

export class ExecutiveRecommendationService {
  constructor(private repos: Repositories) {}

  async refresh(userId: string, profile: ExecutiveDNAProfile): Promise<ExecutiveDNARecommendation[]> {
    const generated = this.buildRecommendations(profile);
    const existing = await this.repos.executiveDna.getRecommendations(userId);
    if (existing.length >= generated.length) {
      return existing;
    }
    return this.repos.executiveDna.saveRecommendations(userId, generated);
  }

  async list(userId: string): Promise<ExecutiveDNARecommendation[]> {
    const profile = await this.repos.executiveDna.ensureProfile(userId);
    return this.refresh(userId, profile);
  }

  private buildRecommendations(
    profile: ExecutiveDNAProfile,
  ): Omit<ExecutiveDNARecommendation, "id" | "createdAt" | "dismissed">[] {
    const recommendations: Omit<ExecutiveDNARecommendation, "id" | "createdAt" | "dismissed">[] =
      [];

    recommendations.push({
      recommendation: "I recommend enabling Calendar integration when it becomes available.",
      category: "integration",
      priority: 80,
    });

    if (profile.profile.researchInterests.some((item) => /aviation|icao|cbta|rvsm/i.test(item))) {
      recommendations.push({
        recommendation: "You frequently review aviation content. Consider enabling Aviation Intelligence.",
        category: "module",
        priority: 90,
      });
    }

    if (
      profile.profile.currentProjects.some((item) =>
        /proposal|construction|steelworks/i.test(item),
      )
    ) {
      recommendations.push({
        recommendation: "I recommend Construction Intelligence for your active project workload.",
        category: "module",
        priority: 88,
      });
    }

    if (profile.profile.profession.toLowerCase().includes("consult")) {
      recommendations.push({
        recommendation: "You may benefit from Proposal Agent for client delivery acceleration.",
        category: "agent",
        priority: 84,
      });
    }

    if (profile.profile.goals.some((goal) => /growth|revenue|sales/i.test(goal))) {
      recommendations.push({
        recommendation: "Connect CRM when available to align brief priorities with pipeline reality.",
        category: "integration",
        priority: 75,
      });
    }

    return recommendations.slice(0, 5);
  }
}
