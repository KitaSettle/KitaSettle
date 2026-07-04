import type { AIExecutiveBriefOutput } from "@/lib/ai/types";
import type { ExecutiveDNAProfile } from "@/lib/types/executive-dna";
import { createId, nowIso } from "@/lib/utils";

function joinList(values: string[]): string {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

export function buildPersonalizedStarterBrief(
  profile: ExecutiveDNAProfile,
): AIExecutiveBriefOutput {
  const { profession, role, goals, focusAreas, currentProjects } = profile.profile;
  const displayRole = role?.trim() || profession?.trim() || "your role";
  const goalText = joinList(goals.slice(0, 2));
  const focusText = joinList(focusAreas.slice(0, 2));
  const projectText = joinList(currentProjects.slice(0, 2));

  const summaryParts = [
    `Good morning. I'm ready to support you as ${displayRole}.`,
    goalText ? `I'll keep ${goalText} in view.` : "Tell me what matters today and I'll shape your brief around it.",
    projectText ? `I'm tracking ${projectText}.` : null,
    focusText ? `I'll protect time for ${focusText}.` : null,
    "Give something to Kita or talk with me anytime — I'll learn as we go.",
  ].filter(Boolean);

  return {
    id: createId("brief"),
    headline: "Good morning — I'm ready to start learning with you",
    executiveSummary: summaryParts.join(" "),
    topPriorities: [
      {
        id: createId("priority"),
        title: goalText ? `Focus on ${goalText}` : "Share what matters most today",
        description: goalText
          ? "I'll refine this as you give me more context."
          : "Paste a note, upload a document, or tell me in Talk to Kita.",
      },
    ],
    risks: [],
    opportunities: [],
    recommendedActions: [
      "Give something to Kita",
      "Talk to Kita about your priorities",
    ],
    estimatedReadingSaved: "—",
    confidence: Math.max(45, profile.overallConfidence),
    topicsUsed: [displayRole],
    generatedAt: nowIso(),
    mock: false,
  };
}
