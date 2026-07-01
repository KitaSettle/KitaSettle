import type { ExecutiveAgent } from "../types/agent";

interface AgentSelectionRule {
  agentId: string;
  keywords: string[];
  priority: number;
}

const SELECTION_RULES: AgentSelectionRule[] = [
  { agentId: "agent-research", keywords: ["research", "changed", "update", "what", "icao", "caam", "faa"], priority: 1 },
  { agentId: "agent-aviation", keywords: ["icao", "caam", "faa", "easa", "aviation", "cbta", "rvsm", "training"], priority: 2 },
  { agentId: "agent-compliance", keywords: ["compliance", "regulation", "circular", "audit", "icao", "caam"], priority: 3 },
  { agentId: "agent-finance", keywords: ["finance", "pricing", "margin", "cost"], priority: 4 },
  { agentId: "agent-proposal", keywords: ["proposal", "steelworks", "client", "cidb"], priority: 5 },
  { agentId: "agent-strategy", keywords: ["strategy", "leadership", "priority", "market"], priority: 6 },
  { agentId: "agent-daily-brief", keywords: ["daily brief", "executive brief", "today", "brief me"], priority: 7 },
];

const WRITER_AGENT_ID = "agent-executive-writer";

export function selectAgents(objective: string, agents: ExecutiveAgent[]): ExecutiveAgent[] {
  const haystack = objective.toLowerCase();
  const selectedIds = new Set<string>();

  for (const rule of SELECTION_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      selectedIds.add(rule.agentId);
    }
  }

  if (selectedIds.size === 0) {
    selectedIds.add("agent-research");
  }

  if (!selectedIds.has("agent-daily-brief")) {
    selectedIds.add(WRITER_AGENT_ID);
  }

  const orderedIds = [...selectedIds].sort((a, b) => {
    const priorityA = SELECTION_RULES.find((rule) => rule.agentId === a)?.priority ?? 99;
    const priorityB = SELECTION_RULES.find((rule) => rule.agentId === b)?.priority ?? 99;
    if (a === WRITER_AGENT_ID) return 1;
    if (b === WRITER_AGENT_ID) return -1;
    return priorityA - priorityB;
  });

  if (orderedIds[orderedIds.length - 1] !== WRITER_AGENT_ID && !selectedIds.has("agent-daily-brief")) {
    orderedIds.push(WRITER_AGENT_ID);
  }

  const agentMap = new Map(agents.map((agent) => [agent.id, agent]));
  return orderedIds
    .map((id) => agentMap.get(id))
    .filter((agent): agent is ExecutiveAgent => Boolean(agent));
}
