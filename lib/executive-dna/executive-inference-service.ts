import type { Repositories } from "@/lib/repositories";
import type { ExecutiveDNAInference, ExecutiveDNAProfile } from "@/lib/types/executive-dna";

export class ExecutiveInferenceService {
  constructor(private repos: Repositories) {}

  async refresh(userId: string, profile: ExecutiveDNAProfile): Promise<void> {
    const inferences = this.inferFromProfile(profile);
    await this.repos.executiveDna.saveInferences(userId, inferences);
  }

  private inferFromProfile(
    profile: ExecutiveDNAProfile,
  ): Omit<ExecutiveDNAInference, "id" | "userId" | "updatedAt">[] {
    const profession = profile.profile.profession.toLowerCase();
    const risk = profile.profile.riskAppetite.toLowerCase();
    const goals = profile.profile.goals;
    const projects = profile.profile.currentProjects;

    return [
      {
        inferenceType: "pain_points",
        confidence: 72,
        payload: {
          items: [
            projects.length > 2 ? "Too many concurrent projects" : "Limited project visibility",
            goals.length === 0 ? "Unclear quarterly goals" : "Goal execution pressure",
          ],
        },
      },
      {
        inferenceType: "strengths",
        confidence: 70,
        payload: {
          items: [
            profile.profile.leadershipStyle || "Decisive leadership",
            profile.profile.communicationStyle || "Clear communication",
          ],
        },
      },
      {
        inferenceType: "weaknesses",
        confidence: 65,
        payload: {
          items: [
            profile.profile.meetingPreferences.includes("minimal")
              ? "Meeting load may fragment focus"
              : "Calendar context not yet connected",
          ],
        },
      },
      {
        inferenceType: "blind_spots",
        confidence: 64,
        payload: {
          items: [
            profession.includes("pilot") || profession.includes("aviation")
              ? "Non-aviation operational issues may receive less attention"
              : "Cross-functional dependencies may be underweighted",
          ],
        },
      },
      {
        inferenceType: "decision_biases",
        confidence: 66,
        payload: {
          items: [
            risk.includes("aggressive")
              ? "May accept higher downside risk for speed"
              : "May delay decisions while gathering more evidence",
          ],
        },
      },
      {
        inferenceType: "opportunities",
        confidence: 71,
        payload: {
          items: profile.profile.focusAreas.length
            ? profile.profile.focusAreas
            : ["Automation of recurring brief preparation"],
        },
      },
      {
        inferenceType: "time_wasters",
        confidence: 63,
        payload: {
          items: ["Manual research triage", "Repeated status reviews without decisions"],
        },
      },
      {
        inferenceType: "productivity_pattern",
        confidence: 68,
        payload: {
          items: [
            profile.profile.preferredWorkingHours || "Morning-focused execution pattern",
            profile.profile.dailyBriefTime
              ? `Best brief consumption around ${profile.profile.dailyBriefTime}`
              : "Brief consumption likely in early work block",
          ],
        },
      },
    ];
  }
}
