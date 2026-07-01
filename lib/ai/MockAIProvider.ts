import type { AIProvider } from "./AIProvider";
import type {
  AIExecutiveBriefInput,
  AIExecutiveBriefOutput,
  ClassifyInput,
  ClassifyOutput,
  CompareDocumentsInput,
  CompareDocumentsOutput,
  ExtractOpportunitiesInput,
  ExtractOpportunitiesOutput,
  ExtractRisksInput,
  ExtractRisksOutput,
  SummarizeInput,
  SummarizeOutput,
} from "./types";
import { createId, nowIso } from "@/lib/utils";

function estimateReadingSaved(wordCount: number): string {
  const minutesSaved = Math.max(8, Math.round(wordCount / 180));
  return `${minutesSaved} minutes`;
}

function collectTopics(input: AIExecutiveBriefInput): string[] {
  const topics = new Set<string>();

  input.knowledge.forEach((item) => item.tags.forEach((tag) => topics.add(tag)));
  input.research.forEach((item) => item.tags.forEach((tag) => topics.add(tag)));
  input.memory.forEach((item) => topics.add(item.category));

  return [...topics].slice(0, 8);
}

function buildSourceCorpus(input: AIExecutiveBriefInput): string {
  return [
    ...input.knowledge.map((item) => `${item.title}. ${item.summary}`),
    ...input.memory.map((item) => `${item.title}. ${item.description}`),
    ...input.research.map((item) => `${item.title}. ${item.summary}`),
  ].join("\n");
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock-ai";
  readonly implementation = "mock" as const;
  readonly ready = true;

  async summarize(input: SummarizeInput): Promise<SummarizeOutput> {
    const limit = input.maxLength ?? 280;
    const prefix = input.context ? `${input.context}: ` : "";
    const trimmed = input.text.trim();

    return {
      summary: `${prefix}${trimmed.slice(0, limit)}${trimmed.length > limit ? "..." : ""}`,
      mock: true,
    };
  }

  async classify(input: ClassifyInput): Promise<ClassifyOutput> {
    const haystack = `${input.title} ${input.content} ${input.source ?? ""}`.toLowerCase();

    if (/aviation|icao|caam|faa|cbta|rvsm/.test(haystack)) {
      return { category: "Aviation", subcategory: "Regulations", tags: ["Aviation", "CBTA"], mock: true };
    }
    if (/finance|pricing|margin/.test(haystack)) {
      return { category: "Finance", subcategory: "Analysis", tags: ["Finance"], mock: true };
    }
    if (/proposal|steelworks|cidb/.test(haystack)) {
      return { category: "Engineering", subcategory: "Projects", tags: ["Proposal", "Steelworks"], mock: true };
    }
    if (/leadership|executive|decision/.test(haystack)) {
      return { category: "Leadership", subcategory: "Strategy", tags: ["Leadership"], mock: true };
    }
    if (/ai|openai|model/.test(haystack)) {
      return { category: "AI", subcategory: "Governance", tags: ["AI"], mock: true };
    }

    return { category: "Business", subcategory: "General", tags: ["Business"], mock: true };
  }

  async extractRisks(input: ExtractRisksInput): Promise<ExtractRisksOutput> {
    const risks = [
      ...input.memory
        .filter((item) => item.importance === "High" || item.category === "Finance")
        .map((item) => ({ id: item.id, title: item.title })),
      ...(input.knowledge.some((item) => item.importance === "High")
        ? [{ id: "risk-regulatory", title: "Regulatory compliance windows require executive review" }]
        : []),
      ...input.research
        .filter((item) => item.importance === "High")
        .slice(0, 1)
        .map((item) => ({ id: item.id, title: `Research risk: ${item.title}` })),
    ].slice(0, 4);

    return { risks, mock: true };
  }

  async extractOpportunities(
    input: ExtractOpportunitiesInput,
  ): Promise<ExtractOpportunitiesOutput> {
    const opportunities = [
      ...input.memory
        .filter((item) => item.category === "Ideas")
        .map((item) => ({ id: item.id, title: item.title })),
      ...input.research
        .filter((item) => item.status === "Ready")
        .slice(0, 2)
        .map((item) => ({ id: item.id, title: item.title })),
    ].slice(0, 4);

    return { opportunities, mock: true };
  }

  async compareDocuments(input: CompareDocumentsInput): Promise<CompareDocumentsOutput> {
    return {
      summary: `Compared "${input.documentA.title}" with "${input.documentB.title}" using mock analysis.`,
      differences: [
        "Scope emphasis differs between documents.",
        "Compliance references are stronger in document A.",
        "Delivery timeline assumptions diverge in document B.",
      ],
      alignmentScore: 72,
      mock: true,
    };
  }

  async generateExecutiveBrief(
    input: AIExecutiveBriefInput,
  ): Promise<AIExecutiveBriefOutput> {
    const corpus = buildSourceCorpus(input);
    const topicsUsed = collectTopics(input);
    const readyResearch = input.research.filter((item) => item.status === "Ready");
    const pendingTasks = input.tasks
      .filter((task) => task.status !== "done")
      .sort((a, b) => a.priority - b.priority);

    const headlineResult = await this.summarize({
      text: `Executive focus today: ${pendingTasks[0]?.title ?? readyResearch[0]?.title ?? "Protect strategic priorities"}`,
      context: "Headline",
      maxLength: 90,
    });

    const summaryResult = await this.summarize({
      text: corpus,
      context: "Executive Summary",
      maxLength: 320,
    });

    const risksResult = await this.extractRisks({
      knowledge: input.knowledge,
      memory: input.memory,
      research: input.research,
    });

    const opportunitiesResult = await this.extractOpportunities({
      knowledge: input.knowledge,
      memory: input.memory,
      research: input.research,
    });

    const topPriorities = pendingTasks.slice(0, 3).map((task) => ({
      id: task.id,
      title: task.title,
      description: `Priority ${task.priority}`,
    }));

    for (const item of readyResearch) {
      if (topPriorities.length >= 3) break;
      topPriorities.push({
        id: item.id,
        title: `Review research: ${item.title}`,
        description: item.summary,
      });
    }

    const recommendedActions = [
      pendingTasks[0]
        ? `Complete ${pendingTasks[0].title} before end of day.`
        : "Review prepared research awaiting approval.",
      readyResearch[0]
        ? `Approve or reject research: ${readyResearch[0].title}.`
        : "Capture one strategic note into Executive Memory.",
      risksResult.risks[0]
        ? `Mitigate risk: ${risksResult.risks[0].title}.`
        : "Protect a 90-minute focus block for deep work.",
    ];

    const averageConfidence =
      input.knowledge.length > 0
        ? Math.round(
            input.knowledge.reduce((total, item) => total + item.confidence, 0) /
              input.knowledge.length,
          )
        : 86;

    const wordCount = corpus.split(/\s+/).filter(Boolean).length;

    return {
      id: createId("brief"),
      headline: headlineResult.summary.replace(/^Headline:\s*/, ""),
      executiveSummary: summaryResult.summary.replace(/^Executive Summary:\s*/, ""),
      topPriorities,
      risks: risksResult.risks,
      opportunities: opportunitiesResult.opportunities,
      recommendedActions,
      estimatedReadingSaved: estimateReadingSaved(wordCount),
      confidence: averageConfidence,
      topicsUsed,
      generatedAt: nowIso(),
      mock: true,
    };
  }
}

export const mockAIProvider = new MockAIProvider();
