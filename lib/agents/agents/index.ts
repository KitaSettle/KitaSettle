import {
  AviationAgent,
  ComplianceAgent,
  DailyBriefAgent,
  ExecutiveWriterAgent,
  FinanceAgent,
  ProposalAgent,
  ResearchAgent,
  StrategyAgent,
} from "./executive-agents";

export const allAgents = [
  new ResearchAgent(),
  new AviationAgent(),
  new StrategyAgent(),
  new FinanceAgent(),
  new ProposalAgent(),
  new ComplianceAgent(),
  new ExecutiveWriterAgent(),
  new DailyBriefAgent(),
];

export {
  ResearchAgent,
  AviationAgent,
  StrategyAgent,
  FinanceAgent,
  ProposalAgent,
  ComplianceAgent,
  ExecutiveWriterAgent,
  DailyBriefAgent,
};
