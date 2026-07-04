import type { ExecutiveDNAFieldKey, ExecutiveDNAProfile } from "@/lib/types/executive-dna";

const CURIOSITY_QUESTIONS: Partial<Record<ExecutiveDNAFieldKey, string>> = {
  profession: "What kind of work do you do day to day?",
  role: "What is your most important role right now?",
  goals: "What should Kita help you with most over the next few months?",
  preferredBriefLength: "Do you prefer short briefings or detailed analysis?",
  decisionStyle: "What kind of decisions do you make most often?",
  focusAreas: "What deserves your attention first on busy days?",
  communicationStyle: "How should I communicate with you — concise, detailed, or advisory?",
  researchInterests: "What topics should I watch on your behalf?",
};

const FIELD_PRIORITY: ExecutiveDNAFieldKey[] = [
  "profession",
  "role",
  "goals",
  "focusAreas",
  "decisionStyle",
  "preferredBriefLength",
  "communicationStyle",
  "researchInterests",
];

function fieldNeedsCuriosity(profile: ExecutiveDNAProfile, field: ExecutiveDNAFieldKey): boolean {
  const confidence =
    profile.fieldConfidence.find((item) => item.fieldKey === field)?.confidence ?? 0;
  const value = profile.profile[field];
  const hasValue = Array.isArray(value)
    ? value.length > 0
    : Boolean(String(value ?? "").trim());
  return !hasValue || confidence < 70;
}

export function getCuriosityQuestion(profile: ExecutiveDNAProfile): string | null {
  for (const field of FIELD_PRIORITY) {
    if (!fieldNeedsCuriosity(profile, field)) continue;
    const question = CURIOSITY_QUESTIONS[field];
    if (question) return question;
  }
  return null;
}
