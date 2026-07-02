import type { Repositories } from "@/lib/repositories";
import type { StoredExecutiveBrief } from "@/lib/types";
import type {
  ExecutiveDNAProfile,
  ExecutivePersonalizationHints,
} from "@/lib/types/executive-dna";
import { DEFAULT_PERSONALIZATION, resolveProfessionTemplate } from "./field-definitions";

export class ExecutivePersonalizationService {
  constructor(private repos: Repositories) {}

  async getHints(userId: string): Promise<ExecutivePersonalizationHints> {
    const profile = await this.repos.executiveDna.ensureProfile(userId);
    return this.personalize(profile);
  }

  personalize(profile: ExecutiveDNAProfile): ExecutivePersonalizationHints {
    const template = resolveProfessionTemplate(profile.profile.profession);
    const focusAreas = profile.profile.focusAreas.length
      ? profile.profile.focusAreas
      : template.emphasisAreas;

    return {
      professionLabel: profile.profile.profession
        ? template.professionLabel
        : DEFAULT_PERSONALIZATION.professionLabel,
      priorityFocus: profile.profile.goals[0] ?? template.priorityFocus,
      briefTone: profile.profile.preferredAiPersonality || template.briefTone,
      emphasisAreas: focusAreas,
    };
  }

  applyToBrief(
    brief: StoredExecutiveBrief,
    hints: ExecutivePersonalizationHints,
  ): StoredExecutiveBrief {
    const emphasis = new Set(hints.emphasisAreas.map((item) => item.toLowerCase()));

    const prioritized = [...brief.priorities].sort((a, b) => {
      const aScore = emphasis.has(a.title.toLowerCase()) ? 1 : 0;
      const bScore = emphasis.has(b.title.toLowerCase()) ? 1 : 0;
      return bScore - aScore;
    });

    return {
      ...brief,
      priorities: prioritized,
      recommendedFocus: hints.priorityFocus || brief.recommendedFocus,
    };
  }
}
