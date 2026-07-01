import type { AgentExecutionContext, AgentResult, ExecutiveAgent } from "../types/agent";

function collectPriorText(context: AgentExecutionContext): string {
  return context.priorResults.map((result) => result.summary).join("\n\n");
}

export class ResearchAgent implements ExecutiveAgent {
  readonly id = "agent-research";
  readonly name = "Research Agent";
  readonly description = "Searches knowledge, memory, and the research queue for relevant findings.";
  readonly supportedSkills = [
    "skill-summarise-regulation",
    "skill-detect-regulation-changes",
  ];
  readonly supportedSources = ["ICAO", "CAAM", "FAA", "EASA", "IATA", "McKinsey", "Harvard Business Review"];

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const query = context.objective;
    const [knowledge, research, memory] = await Promise.all([
      context.services.knowledge.search({ query }),
      context.services.researchQueue.list(),
      context.services.memory.search({ query }),
    ]);

    const matchedResearch = research.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.source.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some((tag) => query.toLowerCase().includes(tag.toLowerCase())),
    );

    const findings = [
      ...knowledge.map((item) => `${item.source}: ${item.title}`),
      ...matchedResearch.map((item) => `${item.source}: ${item.title}`),
      ...memory.map((item) => `Memory: ${item.title}`),
    ];

    const knowledgeUsed = [
      ...knowledge.map((item) => item.id),
      ...memory.map((item) => item.id),
      ...matchedResearch.map((item) => item.id),
    ];

    const sourcesUsed = [
      ...new Set([
        ...knowledge.map((item) => item.source),
        ...matchedResearch.map((item) => item.source),
      ]),
    ];

    const summary = findings.length
      ? `Research findings:\n${findings.slice(0, 5).join("\n")}`
      : "No direct research matches found. Expanded search recommended.";

    return {
      agentId: this.id,
      agentName: this.name,
      summary,
      knowledgeUsed,
      sourcesUsed,
      confidence: findings.length > 0 ? 88 : 62,
      data: { findingCount: findings.length },
    };
  }
}

export class AviationAgent implements ExecutiveAgent {
  readonly id = "agent-aviation";
  readonly name = "Aviation Agent";
  readonly description = "Specialises in aviation regulations, CBTA, RVSM, and operator training updates.";
  readonly supportedSkills = ["skill-summarise-regulation", "skill-compare-documents"];
  readonly supportedSources = ["ICAO", "CAAM", "FAA", "EASA", "IATA", "Boeing", "Airbus"];

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const aviationKnowledge = await context.services.knowledge.search({
      tags: ["ICAO", "CAAM", "CBTA", "RVSM", "FAA"],
    });

    const aviationResearch = (await context.services.researchQueue.list()).filter((item) =>
      ["ICAO", "CAAM", "FAA", "EASA", "IATA", "Boeing"].includes(item.source),
    );

    const relevant = [
      ...aviationKnowledge.map((item) => item.title),
      ...aviationResearch.map((item) => item.title),
    ].filter((title) => title.toLowerCase().includes("icao") || context.objective.toLowerCase().includes("icao") || context.objective.toLowerCase().includes("aviation"));

    const focusItems = relevant.length ? relevant : aviationKnowledge.slice(0, 2).map((item) => item.title);

    const aiSummary = await context.services.ai.summarize({
      text: focusItems.join(". ") || "Aviation regulatory monitoring active.",
      context: "Aviation update",
    });

    return {
      agentId: this.id,
      agentName: this.name,
      summary: aiSummary.summary,
      knowledgeUsed: aviationKnowledge.map((item) => item.id),
      sourcesUsed: ["ICAO", "CAAM", "FAA"],
      confidence: 90,
    };
  }
}

export class StrategyAgent implements ExecutiveAgent {
  readonly id = "agent-strategy";
  readonly name = "Strategy Agent";
  readonly description = "Handles leadership, market signals, and strategic decision support.";
  readonly supportedSkills = ["skill-suggest-priorities", "skill-executive-brief"];
  readonly supportedSources = ["Harvard Business Review", "McKinsey", "World Bank", "OECD"];

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const memory = await context.services.memory.search({ category: "Ideas" });
    const summary = await context.services.ai.summarize({
      text: collectPriorText(context) || context.objective,
      context: "Strategy assessment",
    });

    return {
      agentId: this.id,
      agentName: this.name,
      summary: summary.summary,
      knowledgeUsed: memory.map((item) => item.id),
      sourcesUsed: ["Harvard Business Review", "McKinsey"],
      confidence: 84,
    };
  }
}

export class FinanceAgent implements ExecutiveAgent {
  readonly id = "agent-finance";
  readonly name = "Finance Agent";
  readonly description = "Monitors pricing, margins, and financial decision risks.";
  readonly supportedSkills = ["skill-extract-risks", "skill-extract-deadlines"];
  readonly supportedSources = ["McKinsey", "World Bank", "CIDB"];

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const financeMemory = await context.services.memory.search({ category: "Finance" });
    const financeKnowledge = await context.services.knowledge.search({ tags: ["Finance"] });

    const risks = await context.services.ai.extractRisks({
      knowledge: financeKnowledge,
      memory: financeMemory,
      research: [],
    });

    return {
      agentId: this.id,
      agentName: this.name,
      summary: `Finance review: ${risks.risks.map((risk) => risk.title).join("; ") || "No urgent finance risks flagged."}`,
      knowledgeUsed: [...financeKnowledge.map((item) => item.id), ...financeMemory.map((item) => item.id)],
      sourcesUsed: ["McKinsey"],
      confidence: 86,
      data: { risks: risks.risks },
    };
  }
}

export class ProposalAgent implements ExecutiveAgent {
  readonly id = "agent-proposal";
  readonly name = "Proposal Agent";
  readonly description = "Supports proposal scope, compliance, and client submission readiness.";
  readonly supportedSkills = ["skill-generate-proposal", "skill-extract-risks"];
  readonly supportedSources = ["CIDB"];

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const proposalKnowledge = await context.services.knowledge.search({ tags: ["Proposal", "Steelworks"] });
    const proposalMemory = await context.services.memory.search({ query: "proposal" });

    return {
      agentId: this.id,
      agentName: this.name,
      summary: `Proposal context prepared from ${proposalKnowledge.length} knowledge items and ${proposalMemory.length} memory notes.`,
      knowledgeUsed: [...proposalKnowledge.map((item) => item.id), ...proposalMemory.map((item) => item.id)],
      sourcesUsed: ["CIDB"],
      confidence: 87,
    };
  }
}

export class ComplianceAgent implements ExecutiveAgent {
  readonly id = "agent-compliance";
  readonly name = "Compliance Agent";
  readonly description = "Checks regulatory implications and compliance actions from research findings.";
  readonly supportedSkills = [
    "skill-summarise-regulation",
    "skill-detect-regulation-changes",
    "skill-extract-risks",
  ];
  readonly supportedSources = ["ICAO", "CAAM", "FAA", "EASA", "CIDB", "MCMC"];

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const [knowledge, memory, research] = await Promise.all([
      context.services.knowledge.getAll(),
      context.services.memory.getAll(),
      context.services.researchQueue.list(),
    ]);

    const risks = await context.services.ai.extractRisks({ knowledge, memory, research });
    const prior = collectPriorText(context);

    const summary = await context.services.ai.summarize({
      text: `${prior}\n\nCompliance risks:\n${risks.risks.map((risk) => risk.title).join("\n")}`,
      context: "Compliance review",
    });

    return {
      agentId: this.id,
      agentName: this.name,
      summary: summary.summary,
      knowledgeUsed: knowledge.slice(0, 3).map((item) => item.id),
      sourcesUsed: ["ICAO", "CAAM", "FAA", "EASA"],
      confidence: 89,
      data: { complianceChecks: risks.risks.length },
    };
  }
}

export class ExecutiveWriterAgent implements ExecutiveAgent {
  readonly id = "agent-executive-writer";
  readonly name = "Executive Writer Agent";
  readonly description = "Formats multi-agent outputs into a concise executive-ready answer.";
  readonly supportedSkills = ["skill-executive-brief", "skill-meeting-summary"];
  readonly supportedSources = ["Harvard Business Review"];

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const combined = collectPriorText(context);
    const summary = await context.services.ai.summarize({
      text: combined || context.objective,
      context: "Executive answer",
      maxLength: 420,
    });

    const knowledgeUsed = [
      ...new Set(context.priorResults.flatMap((result) => result.knowledgeUsed)),
    ];
    const sourcesUsed = [
      ...new Set(context.priorResults.flatMap((result) => result.sourcesUsed)),
    ];

    return {
      agentId: this.id,
      agentName: this.name,
      summary: summary.summary,
      knowledgeUsed,
      sourcesUsed,
      confidence: 92,
    };
  }
}

export class DailyBriefAgent implements ExecutiveAgent {
  readonly id = "agent-daily-brief";
  readonly name = "Daily Brief Agent";
  readonly description = "Generates the daily executive brief from all brain services.";
  readonly supportedSkills = ["skill-executive-brief", "skill-suggest-priorities"];
  readonly supportedSources = ["ICAO", "CAAM", "FAA", "Harvard Business Review", "McKinsey"];

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const [knowledge, memory, research] = await Promise.all([
      context.services.knowledge.getAll(),
      context.services.memory.getAll(),
      context.services.researchQueue.list(),
    ]);

    const brief = await context.services.ai.generateExecutiveBrief({
      knowledge,
      memory,
      research,
      calendar: [],
      tasks: [],
    });

    return {
      agentId: this.id,
      agentName: this.name,
      summary: `${brief.headline}\n\n${brief.executiveSummary}`,
      knowledgeUsed: knowledge.slice(0, 5).map((item) => item.id),
      sourcesUsed: brief.topicsUsed,
      confidence: brief.confidence,
      data: { briefId: brief.id },
    };
  }
}
