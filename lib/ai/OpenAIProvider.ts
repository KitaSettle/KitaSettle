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
import type { BriefOpportunity, BriefPriority, BriefRisk } from "@/lib/types/executive";
import { createId, nowIso } from "@/lib/utils";
import { getOpenAIClient, getOpenAIModel } from "./openai-client";

function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 3)}...`;
}

function collectTopics(input: AIExecutiveBriefInput): string[] {
  const topics = new Set<string>();
  input.knowledge.forEach((item) => item.tags.forEach((tag) => topics.add(tag)));
  input.research.forEach((item) => item.tags.forEach((tag) => topics.add(tag)));
  input.memory.forEach((item) => topics.add(item.category));
  return [...topics].slice(0, 8);
}

function buildBriefContext(input: AIExecutiveBriefInput): string {
  return JSON.stringify(
    {
      knowledge: input.knowledge.map((item) => ({
        title: item.title,
        summary: item.summary,
        source: item.source,
        importance: item.importance,
        tags: item.tags,
      })),
      memory: input.memory.map((item) => ({
        title: item.title,
        description: item.description,
        category: item.category,
        importance: item.importance,
      })),
      research: input.research.map((item) => ({
        title: item.title,
        summary: item.summary,
        source: item.source,
        status: item.status,
        importance: item.importance,
        whyItMatters: item.whyItMatters,
      })),
      calendar: input.calendar,
      tasks: input.tasks,
    },
    null,
    2,
  );
}

async function createChatCompletion(
  systemPrompt: string,
  userPrompt: string,
  json = false,
): Promise<string> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: getOpenAIModel(),
    temperature: 0.3,
    response_format: json ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly implementation = "adapter";
  readonly ready = true;

  async summarize(input: SummarizeInput): Promise<SummarizeOutput> {
    const limit = input.maxLength ?? 280;
    const context = input.context ? `${input.context}. ` : "";
    const content = await createChatCompletion(
      "You are an executive intelligence assistant for KitaSettle. Write concise, decision-ready summaries.",
      `${context}Summarise the following in at most ${limit} characters:\n\n${input.text}`,
    );

    return {
      summary: truncate(content, limit),
      mock: false,
    };
  }

  async classify(input: ClassifyInput): Promise<ClassifyOutput> {
    const content = await createChatCompletion(
      "Classify executive intelligence content. Return JSON only.",
      `Classify this content and return JSON with keys category, subcategory, tags (string array):\nTitle: ${input.title}\nSource: ${input.source ?? "Unknown"}\nContent: ${input.content.slice(0, 2000)}`,
      true,
    );

    const parsed = parseJson<{ category: string; subcategory: string; tags: string[] }>(content);
    return {
      category: parsed.category,
      subcategory: parsed.subcategory,
      tags: parsed.tags ?? [],
      mock: false,
    };
  }

  async extractRisks(input: ExtractRisksInput): Promise<ExtractRisksOutput> {
    const content = await createChatCompletion(
      "Extract executive risks. Return JSON only with key risks as array of {id, title}.",
      `Extract up to 4 risks from this context:\n${buildBriefContext({
        ...input,
        calendar: [],
        tasks: [],
      })}`,
      true,
    );

    const parsed = parseJson<{ risks: BriefRisk[] }>(content);
    return {
      risks: (parsed.risks ?? []).slice(0, 4).map((risk, index) => ({
        id: risk.id ?? createId(`risk-${index}`),
        title: risk.title,
      })),
      mock: false,
    };
  }

  async extractOpportunities(
    input: ExtractOpportunitiesInput,
  ): Promise<ExtractOpportunitiesOutput> {
    const content = await createChatCompletion(
      "Extract executive opportunities. Return JSON only with key opportunities as array of {id, title}.",
      `Extract up to 4 opportunities from this context:\n${buildBriefContext({
        ...input,
        calendar: [],
        tasks: [],
      })}`,
      true,
    );

    const parsed = parseJson<{ opportunities: BriefOpportunity[] }>(content);
    return {
      opportunities: (parsed.opportunities ?? []).slice(0, 4).map((item, index) => ({
        id: item.id ?? createId(`opp-${index}`),
        title: item.title,
      })),
      mock: false,
    };
  }

  async compareDocuments(input: CompareDocumentsInput): Promise<CompareDocumentsOutput> {
    const content = await createChatCompletion(
      "Compare two executive documents. Return JSON only with keys summary, differences (string array), alignmentScore (0-100).",
      `Compare these documents:\nA: ${input.documentA.title}\n${input.documentA.content.slice(0, 2500)}\n\nB: ${input.documentB.title}\n${input.documentB.content.slice(0, 2500)}`,
      true,
    );

    const parsed = parseJson<CompareDocumentsOutput>(content);
    return {
      summary: parsed.summary,
      differences: parsed.differences ?? [],
      alignmentScore: parsed.alignmentScore ?? 70,
      mock: false,
    };
  }

  async generateExecutiveBrief(
    input: AIExecutiveBriefInput,
  ): Promise<AIExecutiveBriefOutput> {
    const content = await createChatCompletion(
      [
        "You are KitaSettle's executive intelligence assistant.",
        "Generate a daily executive brief for a founder balancing aviation training, proposals, and strategic decisions.",
        "Return JSON only with keys:",
        "headline, executiveSummary, topPriorities (array of {id, title, description}),",
        "risks (array of {id, title}), opportunities (array of {id, title}),",
        "recommendedActions (string array), estimatedReadingSaved (string), confidence (0-100 number).",
      ].join(" "),
      buildBriefContext(input),
      true,
    );

    const parsed = parseJson<{
      headline: string;
      executiveSummary: string;
      topPriorities: BriefPriority[];
      risks: BriefRisk[];
      opportunities: BriefOpportunity[];
      recommendedActions: string[];
      estimatedReadingSaved: string;
      confidence: number;
    }>(content);

    return {
      id: createId("brief"),
      headline: parsed.headline,
      executiveSummary: parsed.executiveSummary,
      topPriorities: (parsed.topPriorities ?? []).slice(0, 5).map((priority, index) => ({
        id: priority.id ?? createId(`p-${index}`),
        title: priority.title,
        description: priority.description,
      })),
      risks: (parsed.risks ?? []).slice(0, 4).map((risk, index) => ({
        id: risk.id ?? createId(`r-${index}`),
        title: risk.title,
      })),
      opportunities: (parsed.opportunities ?? []).slice(0, 4).map((item, index) => ({
        id: item.id ?? createId(`o-${index}`),
        title: item.title,
      })),
      recommendedActions: parsed.recommendedActions ?? [],
      estimatedReadingSaved: parsed.estimatedReadingSaved ?? "10 minutes",
      confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence ?? 85))),
      topicsUsed: collectTopics(input),
      generatedAt: nowIso(),
      mock: false,
    };
  }
}

export const openAIProvider = new OpenAIProvider();
