import type { IntakeAnalysis, IntakeDelegationResult, IntakeFinding } from "@/lib/types/intake";
import { CONFIDENCE_THRESHOLD } from "./intake-analyzer";

function countLabel(items: IntakeFinding[], type: IntakeFinding["type"], word: string): string | null {
  const count = items.filter((item) => item.type === type).length;
  if (count === 0) return null;
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function buildFindings(analysis: IntakeAnalysis): IntakeFinding[] {
  const findings: IntakeFinding[] = [];

  for (const item of analysis.deadlines.filter((entry) => entry.confidence >= CONFIDENCE_THRESHOLD)) {
    findings.push({ type: "deadline", label: item.label });
  }
  for (const item of analysis.people.filter((entry) => entry.confidence >= CONFIDENCE_THRESHOLD)) {
    findings.push({ type: "person", label: item.label });
  }
  for (const item of analysis.projects.filter((entry) => entry.confidence >= CONFIDENCE_THRESHOLD)) {
    findings.push({ type: "project", label: item.label });
  }
  for (const item of analysis.risks.filter((entry) => entry.confidence >= CONFIDENCE_THRESHOLD)) {
    findings.push({ type: "risk", label: item.label });
  }
  for (const item of analysis.opportunities.filter((entry) => entry.confidence >= CONFIDENCE_THRESHOLD)) {
    const type = /contract|renewal/i.test(item.label) ? "contract" : "opportunity";
    findings.push({ type, label: item.label });
  }
  for (const item of analysis.tasks.filter((entry) => entry.confidence >= CONFIDENCE_THRESHOLD)) {
    findings.push({ type: "task", label: item.label });
  }
  for (const item of analysis.reminders.filter((entry) => entry.confidence >= CONFIDENCE_THRESHOLD)) {
    findings.push({ type: "reminder", label: item.label });
  }

  return findings.slice(0, 12);
}

export function buildNaturalResponse(
  analysis: IntakeAnalysis,
  findings: IntakeFinding[],
): Pick<IntakeDelegationResult, "message" | "findings" | "needsClarification" | "clarificationQuestions"> {
  const intro =
    analysis.overallConfidence >= CONFIDENCE_THRESHOLD
      ? "I've understood this."
      : "I've received this, but I'm not fully confident yet.";

  const bullets = findings.slice(0, 6).map((finding) => `• ${finding.label}`);
  const summaryParts = [
    countLabel(findings, "deadline", "important deadline"),
    countLabel(findings, "person", "person"),
    countLabel(findings, "contract", "contract renewal"),
    countLabel(findings, "risk", "possible risk"),
    countLabel(findings, "opportunity", "opportunity"),
    countLabel(findings, "task", "task"),
  ].filter(Boolean);

  const foundLine =
    bullets.length > 0
      ? `I found:\n${bullets.join("\n")}`
      : summaryParts.length > 0
        ? `I found: ${summaryParts.join(", ")}.`
        : "I'm storing the key points for your Executive Brain.";

  const closing =
    analysis.overallConfidence >= CONFIDENCE_THRESHOLD
      ? "I've added it to your Executive Brain."
      : "I've saved a draft — tell me more if you'd like me to refine it.";

  const clarification =
    analysis.needsUserClarification && analysis.clarificationQuestions.length > 0
      ? `\n\n${analysis.clarificationQuestions[0]}`
      : "";

  return {
    message: `${intro}\n\n${foundLine}\n\n${closing}${clarification}`,
    findings,
    needsClarification: analysis.needsUserClarification,
    clarificationQuestions: analysis.clarificationQuestions,
  };
}
