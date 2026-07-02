export interface User {
  name: string;
  email: string;
}

export interface Priority {
  id: string;
  title: string;
  description?: string;
}

export interface Decision {
  id: string;
  title: string;
  status: "needs-approval" | "review";
}

export interface Risk {
  id: string;
  title: string;
}

export interface Opportunity {
  id: string;
  title: string;
}

export interface PreparedItem {
  id: string;
  title: string;
  description: string;
}

export interface QuickAction {
  id: string;
  label: string;
}

export interface ExecutiveBrief {
  summary: string;
  confidenceScore: number;
  recommendedFocus: string;
  priorities: Priority[];
  decisions: Decision[];
  risks: Risk[];
  opportunities: Opportunity[];
  aiPrepared: PreparedItem[];
  workloadEstimate: string;
}

export type NavItem = {
  label: string;
  href: string;
  icon: "dashboard" | "brain" | "settings";
};

export interface TrustedSource {
  id: string;
  name: string;
  category: string;
  description: string;
  searchTags: string[];
}

export interface ResearchQueueItem {
  id: string;
  title: string;
  source: string;
  confidence: number;
  importance: "High" | "Medium" | "Low";
  summary: string;
  whyItMatters: string;
  sourceUrl: string;
  searchTags: string[];
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  itemCount: number;
  description: string;
  searchTags: string[];
}

export interface ExecutiveMemoryItem {
  id: string;
  title: string;
  snippet: string;
  date: string;
  category: string;
  searchTags: string[];
}

export interface ExecutiveSkill {
  id: string;
  name: string;
  description: string;
  status: "active" | "available";
  searchTags: string[];
}

export interface BrainActivityItem {
  id: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface BrainOverviewMetrics {
  knowledgeItems: number;
  executiveMemories: number;
  skills: number;
  trustedSources: number;
  researchWaiting: number;
  brainHealth: number;
  estimatedTimeSavedHours: number;
}

export interface ExecutiveBrainData {
  overview: BrainOverviewMetrics;
  trustedSources: TrustedSource[];
  researchQueue: ResearchQueueItem[];
  categories: KnowledgeCategory[];
  memory: ExecutiveMemoryItem[];
  skills: ExecutiveSkill[];
  activity: BrainActivityItem[];
}
