import type { MemoryItem } from "@/lib/types/memory";
import type { ResearchQueueRecord } from "@/lib/types/research";
import type { DbSkill } from "@/lib/database/types";
import type {
  ExecutiveMemoryItem,
  ExecutiveSkill,
  ResearchQueueItem,
} from "@/lib/types/ui";
import type { SkillDefinition } from "@/lib/types/skills";

function formatMemoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function mapResearchQueueRecordToUi(record: ResearchQueueRecord): ResearchQueueItem {
  return {
    id: record.id,
    title: record.title,
    source: record.source,
    confidence: record.confidence,
    importance: record.importance,
    summary: record.summary,
    whyItMatters: record.whyItMatters,
    sourceUrl: record.sourceUrl,
    searchTags: record.tags,
  };
}

export function mapMemoryItemToUi(item: MemoryItem): ExecutiveMemoryItem {
  return {
    id: item.id,
    title: item.title,
    snippet: item.description,
    date: formatMemoryDate(item.createdAt),
    category: item.category,
    searchTags: item.searchTags ?? [],
  };
}

export function mapSkillDefinitionToUi(skill: SkillDefinition): ExecutiveSkill {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    status: skill.enabled ? "active" : "available",
    searchTags: skill.searchTags ?? [],
  };
}

export function mapDbSkillToUi(row: DbSkill): ExecutiveSkill {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.enabled ? "active" : "available",
    searchTags: row.search_tags,
  };
}
