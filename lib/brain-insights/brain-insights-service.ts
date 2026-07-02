import type { TransparencyRepository } from "@/lib/repositories/transparency-repository";
import type { Repositories } from "@/lib/repositories";
import type {
  BrainHelpSuggestion,
  BrainInsightsPayload,
  BrainLearningMoment,
  BrainUnderstandingItem,
} from "@/lib/types/brain-insights";
import type { ExecutiveDNAFieldKey, ExecutiveDNAProfile } from "@/lib/types/executive-dna";
import { humanConfidenceSummary } from "@/lib/transparency/build-transparency";
import { nowIso } from "@/lib/utils";

const UNDERSTANDING_MAP: Array<{
  id: string;
  label: string;
  fieldKey: ExecutiveDNAFieldKey;
}> = [
  { id: "profession", label: "Profession", fieldKey: "profession" },
  { id: "projects", label: "Projects", fieldKey: "currentProjects" },
  { id: "communication", label: "Communication Style", fieldKey: "communicationStyle" },
  { id: "decision", label: "Decision Style", fieldKey: "decisionStyle" },
  { id: "goals", label: "Goals", fieldKey: "goals" },
  { id: "priorities", label: "Priorities", fieldKey: "focusAreas" },
  { id: "industry", label: "Industry Knowledge", fieldKey: "industry" },
  { id: "relationships", label: "Relationships", fieldKey: "meetingPreferences" },
  { id: "patterns", label: "Working Patterns", fieldKey: "preferredWorkingHours" },
];

const HELP_SUGGESTIONS: BrainHelpSuggestion[] = [
  { id: "plan", label: "A strategic plan", reason: "It would sharpen how I prioritise your week." },
  { id: "recording", label: "A meeting recording", reason: "It helps me learn how you actually decide in the room." },
  { id: "proposal", label: "A project proposal", reason: "It gives me context on what you are trying to move forward." },
  { id: "goals", label: "Company goals", reason: "It anchors my recommendations to what matters long term." },
  { id: "calendar", label: "Your calendar", reason: "It helps me protect your time and spot patterns." },
  { id: "email", label: "Important email threads", reason: "It shows me what is waiting on you right now." },
  { id: "presentation", label: "A recent presentation", reason: "It reveals what you are communicating to others." },
];

function fieldConfidence(profile: ExecutiveDNAProfile, fieldKey: ExecutiveDNAFieldKey): number {
  return profile.fieldConfidence.find((field) => field.fieldKey === fieldKey)?.confidence ?? 0;
}

function hasValue(profile: ExecutiveDNAProfile, fieldKey: ExecutiveDNAFieldKey): boolean {
  const value = profile.profile[fieldKey];
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(String(value ?? "").trim());
}

function formatPeriod(dateIso: string): string {
  const date = new Date(dateIso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) {
    return date.toLocaleDateString("en-GB", { weekday: "long" });
  }
  if (diffDays <= 14) return "Last week";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function storyFromLearning(reason: string, fieldKey: string): string {
  const normalized = reason.trim();
  if (normalized) return normalized;
  if (fieldKey.includes("project")) return "I learned more about one of your active projects.";
  if (fieldKey.includes("goal")) return "I refined my picture of what you are working toward.";
  return "I updated my understanding of how you work.";
}

export class BrainInsightsService {
  constructor(
    private repos: Repositories,
    private transparency: TransparencyRepository,
  ) {}

  async getInsights(userId: string): Promise<BrainInsightsPayload> {
    const [profile, inferences, recommendations, learningHistory, counts] = await Promise.all([
      this.repos.executiveDna.ensureProfile(userId),
      this.repos.executiveDna.getInferences(userId),
      this.repos.executiveDna.getRecommendations(userId),
      this.transparency.getLearningHistory(userId, 30),
      this.transparency.getCounts(userId),
    ]);

    const whatIUnderstand = this.buildUnderstanding(profile);
    const howILearn = this.buildLearningStory(learningHistory);
    const helpMeUnderstand = this.buildHelpSuggestions(profile, recommendations);
    const strengths = this.buildStrengths(profile, inferences, counts);
    const limitations = this.buildLimitations(profile, inferences);

    const recentLearning = learningHistory.filter((event) => {
      const age = Date.now() - new Date(event.createdAt).getTime();
      return age <= 7 * 86400000;
    }).length;

    return {
      generatedAt: nowIso(),
      whatIUnderstand,
      howILearn,
      helpMeUnderstand,
      strengths,
      limitations,
      overallConfidence: profile.overallConfidence,
      learningProgressLabel: recentLearning > 0 ? "Growing Every Day" : "Just Getting Started",
      learningProgressSummary:
        recentLearning > 0
          ? "Every conversation, document, and decision helps me serve you more personally."
          : "Give me a little more context and I will start tailoring your briefs to you.",
    };
  }

  private buildUnderstanding(profile: ExecutiveDNAProfile): BrainUnderstandingItem[] {
    const items: BrainUnderstandingItem[] = UNDERSTANDING_MAP.map(({ id, label, fieldKey }) => {
      const confidence = hasValue(profile, fieldKey)
        ? Math.max(fieldConfidence(profile, fieldKey), 35)
        : Math.max(fieldConfidence(profile, fieldKey), 15);

      return {
        id,
        label,
        confidence,
        summary: humanConfidenceSummary(label, confidence),
      };
    });

    items.push({
      id: "learning-progress",
      label: "Learning Progress",
      confidence: profile.overallConfidence,
      summary:
        profile.overallConfidence >= 75
          ? "I am learning steadily — and getting more useful every day."
          : "I am still early in learning you, but I improve with every interaction.",
      isGrowing: true,
    });

    return items;
  }

  private buildLearningStory(
    events: Awaited<ReturnType<TransparencyRepository["getLearningHistory"]>>,
  ): BrainLearningMoment[] {
    const grouped = new Map<string, BrainLearningMoment[]>();

    for (const event of events.slice(0, 12)) {
      const periodLabel = formatPeriod(event.createdAt);
      const story = storyFromLearning(event.reason, String(event.fieldKey));
      const moment: BrainLearningMoment = {
        id: event.id,
        periodLabel,
        story,
        occurredAt: event.createdAt,
      };
      const bucket = grouped.get(periodLabel) ?? [];
      bucket.push(moment);
      grouped.set(periodLabel, bucket);
    }

    return [...grouped.entries()].flatMap(([, moments]) => moments).slice(0, 8);
  }

  private buildHelpSuggestions(
    profile: ExecutiveDNAProfile,
    recommendations: Awaited<ReturnType<Repositories["executiveDna"]["getRecommendations"]>>,
  ): BrainHelpSuggestion[] {
    const suggestions = [...HELP_SUGGESTIONS];
    const lowConfidenceFields = UNDERSTANDING_MAP.filter(
      ({ fieldKey }) => fieldConfidence(profile, fieldKey) < 65 || !hasValue(profile, fieldKey),
    );

    for (const rec of recommendations.filter((item) => !item.dismissed).slice(0, 3)) {
      suggestions.unshift({
        id: `rec-${rec.id}`,
        label: rec.recommendation.replace(/^Share /i, "").replace(/\.$/, ""),
        reason: "This would help me prepare sharper briefs for you.",
      });
    }

    if (lowConfidenceFields.some((field) => field.fieldKey === "goals")) {
      return suggestions.slice(0, 6);
    }

    return suggestions.slice(0, 5);
  }

  private buildStrengths(
    profile: ExecutiveDNAProfile,
    inferences: Awaited<ReturnType<Repositories["executiveDna"]["getInferences"]>>,
    counts: Awaited<ReturnType<TransparencyRepository["getCounts"]>>,
  ): string[] {
    const strengths = new Set<string>();
    const inferenceStrengths = inferences
      .filter((item) => item.inferenceType === "strengths")
      .flatMap((item) => Object.values(item.payload).map(String));

    for (const value of inferenceStrengths.slice(0, 3)) {
      strengths.add(value);
    }

    if (fieldConfidence(profile, "currentProjects") >= 75 || counts.projects > 0) {
      strengths.add("I know your projects well.");
    }
    if (fieldConfidence(profile, "focusAreas") >= 70) {
      strengths.add("I understand your priorities.");
    }
    if (counts.documentsLearned > 0) {
      strengths.add("I remember your important documents.");
    }
    if (counts.meetingsUnderstood > 0) {
      strengths.add("I recognise recurring meetings and rhythms in your calendar.");
    }
    if (strengths.size === 0) {
      strengths.add("I am ready to learn — give me something to work with.");
    }

    return [...strengths].slice(0, 5);
  }

  private buildLimitations(
    profile: ExecutiveDNAProfile,
    inferences: Awaited<ReturnType<Repositories["executiveDna"]["getInferences"]>>,
  ): string[] {
    const limitations = new Set<string>();
    const inferenceWeaknesses = inferences
      .filter((item) => ["weaknesses", "blind_spots"].includes(item.inferenceType))
      .flatMap((item) => Object.values(item.payload).map(String));

    for (const value of inferenceWeaknesses.slice(0, 2)) {
      limitations.add(value.endsWith(".") ? value : `${value}.`);
    }

    if (fieldConfidence(profile, "goals") < 60 || profile.profile.goals.length === 0) {
      limitations.add("I don't know your long-term goals yet.");
    }
    if (fieldConfidence(profile, "industry") < 55) {
      limitations.add("I haven't seen enough context about your industry yet.");
    }
    if (fieldConfidence(profile, "decisionStyle") < 50) {
      limitations.add("I'm still learning how you prefer to make decisions.");
    }
    if (limitations.size === 0) {
      limitations.add("I'm still learning — the more you share, the more precise I become.");
    }

    return [...limitations].slice(0, 4);
  }
}

export function createBrainInsightsService(
  repos: Repositories,
  transparency: TransparencyRepository,
): BrainInsightsService {
  return new BrainInsightsService(repos, transparency);
}
