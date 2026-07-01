export interface DbUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface DbExecutiveMemory {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  importance: "High" | "Medium" | "Low";
  related_knowledge: string[];
  search_tags: string[];
  status: "active" | "archived" | "pending";
  created_at: string;
  updated_at: string;
}

export interface DbKnowledge {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  url: string;
  category: string;
  subcategory: string;
  confidence: number;
  published_date: string;
  last_reviewed: string;
  related_items: string[];
  tags: string[];
  importance: "High" | "Medium" | "Low";
  created_at: string;
  updated_at: string;
}

export interface DbResearchQueue {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  source: string;
  source_url: string;
  confidence: number;
  importance: "High" | "Medium" | "Low";
  why_it_matters: string;
  status: string;
  tags: string[];
  queued_at: string;
  updated_at: string;
}

export interface DbExecutiveBrief {
  id: string;
  user_id: string;
  summary: string;
  confidence_score: number;
  recommended_focus: string;
  priorities: unknown;
  decisions: unknown;
  risks: unknown;
  opportunities: unknown;
  ai_prepared: unknown;
  workload_estimate: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSkill {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  input_description: string;
  output_description: string;
  enabled: boolean;
  search_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DbBrainActivity {
  id: string;
  user_id: string;
  action: string;
  target: string;
  created_at: string;
}
