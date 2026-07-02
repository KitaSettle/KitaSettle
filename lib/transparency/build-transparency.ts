import type { DecisionInputSource, DecisionItem } from "@/lib/types/decision-engine";
import type { ExecutiveDNAProfile } from "@/lib/types/executive-dna";
import type { WhyTransparency } from "@/lib/types/transparency";

const SOURCE_LABELS: Record<DecisionInputSource, string> = {
  calendar: "Your calendar",
  email: "Important emails",
  research: "Research you have reviewed",
  knowledge: "Your saved knowledge",
  project: "Your active projects",
  approval: "Items waiting for your approval",
  document: "Documents you have shared",
  deadline: "Upcoming deadlines",
  memory: "Your Executive Memory",
  executive_dna: "What Kita knows about how you work",
};

function confidenceLabel(value: number): string {
  if (value >= 90) return "Kita is very confident about this recommendation.";
  if (value >= 75) return "Kita is reasonably confident, based on what you have shared.";
  if (value >= 60) return "Kita believes this is worth your attention, but is still learning your context.";
  return "Kita is suggesting this cautiously — more context would help.";
}

function missingForSource(source: DecisionInputSource, dna: ExecutiveDNAProfile | null): string[] {
  const missing: string[] = [];
  const confidence = (key: string) =>
    dna?.fieldConfidence.find((field) => field.fieldKey === key)?.confidence ?? 0;

  if (source === "calendar" && confidence("meetingPreferences") < 60) {
    missing.push("More detail about how you prefer to run meetings");
  }
  if (source === "email" && confidence("communicationStyle") < 60) {
    missing.push("A clearer picture of your communication preferences");
  }
  if (confidence("goals") < 55) {
    missing.push("Your longer-term goals");
  }
  if ((dna?.profile.currentProjects.length ?? 0) === 0) {
    missing.push("Which projects matter most right now");
  }
  if (missing.length === 0) {
    missing.push("Anything else you think would sharpen this recommendation");
  }
  return missing.slice(0, 3);
}

export function buildDecisionTransparency(
  item: DecisionItem,
  dna: ExecutiveDNAProfile | null = null,
): WhyTransparency {
  const detail = item.explanationDetail;
  const used = [
    SOURCE_LABELS[item.source] ?? "Information you have shared with Kita",
    ...item.because.filter(Boolean).slice(0, 2),
  ];

  return {
    whyMatters: detail.whyMatters || item.explanation,
    whyNow: detail.whyNow || "It fits what deserves your attention today.",
    confidence: item.confidence,
    confidenceLabel: confidenceLabel(item.confidence),
    informationUsed: [...new Set(used)],
    informationMissing: missingForSource(item.source, dna),
    ifIgnored: detail.ifIgnored || undefined,
    expectedOutcome: detail.expectedOutcome || undefined,
  };
}

export function buildResearchTransparency(item: {
  whyItMatters: string;
  summary: string;
  source: string;
  confidence: number;
}): WhyTransparency {
  return {
    whyMatters: item.whyItMatters,
    whyNow: "This surfaced because it may affect your priorities.",
    confidence: item.confidence,
    confidenceLabel: confidenceLabel(item.confidence),
    informationUsed: [item.source, "Trusted sources Kita monitors for you"],
    informationMissing: ["Any company-specific context that changes how you read this"],
  };
}

export function buildRecommendationTransparency(item: {
  recommendation: string;
  category: string;
}): WhyTransparency {
  return {
    whyMatters: item.recommendation,
    whyNow: "Sharing this would help Kita prepare better briefs for you.",
    confidence: 72,
    confidenceLabel: confidenceLabel(72),
    informationUsed: ["Your Executive DNA profile", `Focus area: ${item.category}`],
    informationMissing: ["The specific document, plan, or context behind this suggestion"],
  };
}

export function humanConfidenceSummary(label: string, confidence: number): string {
  if (confidence >= 90) return `I understand your ${label.toLowerCase()} very well.`;
  if (confidence >= 80) return `I have a strong sense of your ${label.toLowerCase()}.`;
  if (confidence >= 70) return `I'm building a clear picture of your ${label.toLowerCase()}.`;
  if (confidence >= 50) return `I'm still learning about your ${label.toLowerCase()}.`;
  return `I don't know much about your ${label.toLowerCase()} yet.`;
}
