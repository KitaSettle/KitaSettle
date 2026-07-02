import type { Repositories } from "@/lib/repositories";
import type { IntakeDelegationResult, IntakeProcessingStatus } from "@/lib/types/intake";
import { createExecutiveDNAEngine } from "@/lib/executive-dna";
import { generateEmbedding } from "@/lib/integrations/embeddings";
import { nowIso } from "@/lib/utils";
import type { ExtractedIntakeContent } from "./content-extractor";
import { analyzeIntakeContent, CONFIDENCE_THRESHOLD } from "./intake-analyzer";
import { buildFindings, buildNaturalResponse } from "./intake-response";

export class IntakeService {
  constructor(private repos: Repositories) {}

  async delegate(userId: string, content: ExtractedIntakeContent): Promise<IntakeDelegationResult> {
    const dnaProfile = await this.repos.executiveDna.getProfile(userId);
    const analysis = await analyzeIntakeContent(content, dnaProfile);
    const findings = buildFindings(analysis);
    const response = buildNaturalResponse(analysis, findings);

    const status: IntakeProcessingStatus =
      analysis.overallConfidence < CONFIDENCE_THRESHOLD || analysis.needsUserClarification
        ? "needs_clarification"
        : "completed";

    const embedding = await generateEmbedding(`${analysis.title}\n${analysis.summary}`);
    const knowledge = await this.repos.knowledge.create(userId, {
      title: analysis.title,
      summary: analysis.summary,
      content: content.text.slice(0, 20_000),
      source: "Delegated to Kita",
      url: content.sourceType === "url" ? content.sourceLabel : "",
      category: analysis.category,
      subcategory: analysis.subcategory,
      confidence: analysis.overallConfidence,
      publishedDate: nowIso(),
      lastReviewed: nowIso(),
      relatedItems: [],
      tags: [...new Set([...analysis.tags, "kita-intake"])],
      importance: analysis.overallConfidence >= 85 ? "High" : "Medium",
    });

    await this.repos.documents.upsertDocuments(userId, "google", [
      {
        externalId: `intake:${knowledge.id}`,
        name: content.sourceLabel,
        mimeType: content.mimeType,
        modifiedAt: nowIso(),
        summary: analysis.summary,
        requiresReview: analysis.risks.some((risk) => risk.confidence >= CONFIDENCE_THRESHOLD),
        embedding,
      },
    ]);

    for (const person of analysis.people.filter((item) => item.confidence >= CONFIDENCE_THRESHOLD).slice(0, 5)) {
      await this.repos.memory.create(
        userId,
        {
          title: person.label,
          description: `Mentioned in ${content.sourceLabel}.`,
          category: "People",
          importance: "Medium",
          relatedKnowledge: [knowledge.id],
          status: "active",
        },
        ["people", "intake"],
      );
    }

    for (const task of analysis.tasks.filter((item) => item.confidence >= CONFIDENCE_THRESHOLD).slice(0, 5)) {
      await this.repos.memory.create(
        userId,
        {
          title: task.label,
          description: `Task detected from ${content.sourceLabel}.`,
          category: "Task",
          importance: "High",
          relatedKnowledge: [knowledge.id],
          status: "active",
        },
        ["task", "intake"],
      );
    }

    for (const reminder of analysis.reminders
      .filter((item) => item.confidence >= CONFIDENCE_THRESHOLD)
      .slice(0, 5)) {
      await this.repos.memory.create(
        userId,
        {
          title: reminder.label,
          description: reminder.dueAt
            ? `Reminder due ${new Date(reminder.dueAt).toLocaleDateString()}.`
            : `Reminder from ${content.sourceLabel}.`,
          category: "Reminder",
          importance: "High",
          relatedKnowledge: [knowledge.id],
          status: "active",
        },
        ["reminder", "intake"],
      );
    }

    for (const deadline of analysis.deadlines
      .filter((item) => item.confidence >= CONFIDENCE_THRESHOLD)
      .slice(0, 5)) {
      const dueAt = deadline.dueAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await this.repos.calendar.upsertEvents(userId, "google", [
        {
          externalId: `intake-deadline:${knowledge.id}:${deadline.label.slice(0, 24)}`,
          title: deadline.label,
          description: `Detected from ${content.sourceLabel}.`,
          startAt: dueAt,
          endAt: dueAt,
          allDay: true,
          category: "reminder",
          eventType: "intake_deadline",
        },
      ]);
    }

    for (const risk of analysis.risks.filter((item) => item.confidence >= CONFIDENCE_THRESHOLD).slice(0, 3)) {
      await this.repos.memory.create(
        userId,
        {
          title: risk.label,
          description: `Risk flagged from ${content.sourceLabel}.`,
          category: "Risk",
          importance: "High",
          relatedKnowledge: [knowledge.id],
          status: "active",
        },
        ["risk", "intake"],
      );
    }

    await this.repos.brainActivity.add(userId, "Received from you", analysis.title);

    const dnaEngine = createExecutiveDNAEngine(this.repos);
    await dnaEngine.learningService.observeDocumentUpload(
      userId,
      analysis.tags,
      analysis.projects.map((project) => project.label),
      content.sourceLabel,
    );

    if (analysis.opportunities.some((item) => item.confidence >= CONFIDENCE_THRESHOLD)) {
      await dnaEngine.learningService.observeKnowledgeSaved(userId, analysis.tags, analysis.category);
    }

    const intakeRecord = await this.repos.intake.create(userId, {
      sourceType: content.sourceType,
      sourceLabel: content.sourceLabel,
      mimeType: content.mimeType,
      contentPreview: content.text.slice(0, 1000),
      analysis,
      status,
      knowledgeId: knowledge.id,
    });

    return {
      intakeId: intakeRecord.id,
      knowledgeId: knowledge.id,
      overallConfidence: analysis.overallConfidence,
      ...response,
    };
  }
}

export function createIntakeService(repos: Repositories): IntakeService {
  return new IntakeService(repos);
}
