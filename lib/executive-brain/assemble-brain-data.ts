import type { Repositories } from "@/lib/repositories";
import type { ExecutiveBrainData } from "@/lib/types/ui";
import {
  BRAIN_SEARCH_KEYWORDS,
  STATIC_KNOWLEDGE_CATEGORIES,
  STATIC_TRUSTED_SOURCES,
} from "./static-config";
import {
  mapMemoryItemToUi,
  mapResearchQueueRecordToUi,
  mapSkillDefinitionToUi,
} from "./mappers";

export async function assembleExecutiveBrainData(
  userId: string,
  repos: Repositories,
): Promise<ExecutiveBrainData> {
  const [knowledge, memoryRows, queueRows, skillsRows, activity] = await Promise.all([
    repos.knowledge.getAll(userId),
    repos.memory.getAll(userId),
    repos.researchQueue.listPending(userId),
    repos.skills.listSkills(userId),
    repos.brainActivity.list(userId),
  ]);

  const categories = STATIC_KNOWLEDGE_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    searchTags: [...category.searchTags],
    itemCount: knowledge.filter((item) => item.category === category.name).length,
  }));

  const memory = memoryRows
    .filter((item) => item.status !== "archived")
    .map(mapMemoryItemToUi);

  const researchQueue = queueRows.map(mapResearchQueueRecordToUi);
  const skills = skillsRows.map((skill) => mapSkillDefinitionToUi(skill));

  return {
    overview: {
      knowledgeItems: knowledge.length,
      executiveMemories: memory.length,
      skills: skills.filter((s) => s.status === "active").length,
      trustedSources: STATIC_TRUSTED_SOURCES.length,
      researchWaiting: researchQueue.length,
      brainHealth: Math.min(99, 70 + Math.min(knowledge.length, 25)),
      estimatedTimeSavedHours: 14.5,
    },
    trustedSources: STATIC_TRUSTED_SOURCES.map((source) => ({
      id: source.id,
      name: source.name,
      category: source.category,
      description: source.description,
      searchTags: [...source.searchTags],
    })),
    researchQueue,
    categories,
    memory,
    skills,
    activity,
  };
}

export { BRAIN_SEARCH_KEYWORDS };
