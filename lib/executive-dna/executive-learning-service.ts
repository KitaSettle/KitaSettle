import type { Repositories } from "@/lib/repositories";
import type {
  ExecutiveDNAFieldKey,
  ExecutiveDNAProfile,
  ExecutiveDNALearningSource,
} from "@/lib/types/executive-dna";

export class ExecutiveLearningService {
  constructor(private repos: Repositories) {}

  async observe(
    userId: string,
    fieldKey: ExecutiveDNAFieldKey,
    value: unknown,
    source: ExecutiveDNALearningSource,
    reason: string,
    confidenceBoost = 6,
  ): Promise<ExecutiveDNAProfile> {
    const profile = await this.repos.executiveDna.ensureProfile(userId);
    const existingConfidence =
      profile.fieldConfidence.find((field) => field.fieldKey === fieldKey)?.confidence ?? 0;

    return this.repos.executiveDna.updateProfileField(
      userId,
      fieldKey,
      this.mergeValue(
        (profile.profile as unknown as Record<string, unknown>)[fieldKey],
        value,
        fieldKey,
      ),
      Math.min(100, existingConfidence + confidenceBoost),
      source,
      reason,
    );
  }

  async observeApproval(userId: string, tags: string[], sourceName: string): Promise<void> {
    if (tags.length > 0) {
      await this.observe(
        userId,
        "researchInterests",
        tags,
        "approval",
        `Approved research from ${sourceName}.`,
        4,
      );
    }
    await this.observe(
      userId,
      "importantTopics",
      tags.length > 0 ? tags : [sourceName],
      "approval",
      `Approved research item from ${sourceName}.`,
      3,
    );
  }

  async observeRejection(userId: string, tags: string[], title: string): Promise<void> {
    await this.observe(
      userId,
      "focusAreas",
      tags,
      "rejection",
      `Rejected research: ${title}. Adjusting emphasis away from low-value signals.`,
      2,
    );
  }

  async observeKnowledgeSaved(userId: string, tags: string[], category: string): Promise<void> {
    await this.observe(
      userId,
      "learningInterests",
      tags.length > 0 ? tags : [category],
      "knowledge_saved",
      `Saved knowledge in ${category}.`,
      3,
    );
  }

  async observeDocumentUpload(
    userId: string,
    tags: string[],
    projects: string[],
    sourceLabel: string,
  ): Promise<void> {
    if (projects.length > 0) {
      await this.observe(
        userId,
        "currentProjects",
        projects,
        "document_upload",
        `Delegated content linked to projects from ${sourceLabel}.`,
        4,
      );
    }
    await this.observe(
      userId,
      "importantTopics",
      tags.length > 0 ? tags : [sourceLabel],
      "document_upload",
      `Delegated ${sourceLabel} to Kita.`,
      5,
    );
    await this.observe(
      userId,
      "confidenceThreshold",
      "standard",
      "document_upload",
      `Processed delegated intake: ${sourceLabel}.`,
      2,
    );
  }

  async observeBriefUsage(userId: string): Promise<void> {
    await this.observe(
      userId,
      "preferredBriefLength",
      "standard",
      "brief_usage",
      "Daily executive brief viewed.",
      1,
    );
  }

  async observeResearchOpened(userId: string, tags: string[]): Promise<void> {
    await this.observe(
      userId,
      "researchInterests",
      tags,
      "research_opened",
      "Research item opened for review.",
      2,
    );
  }

  private mergeValue(existing: unknown, incoming: unknown, fieldKey: ExecutiveDNAFieldKey): unknown {
    const arrayFields: ExecutiveDNAFieldKey[] = [
      "responsibilities",
      "goals",
      "currentProjects",
      "researchInterests",
      "learningInterests",
      "importantTopics",
      "focusAreas",
    ];

    if (!arrayFields.includes(fieldKey)) {
      return incoming ?? existing;
    }

    const current = Array.isArray(existing) ? existing.map(String) : [];
    const next = Array.isArray(incoming) ? incoming.map(String) : [String(incoming)];
    return [...new Set([...current, ...next.filter(Boolean)])].slice(0, 12);
  }
}
