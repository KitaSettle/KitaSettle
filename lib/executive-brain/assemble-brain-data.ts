import type { Repositories } from "@/lib/repositories";
import type { ExecutiveBrainData } from "@/lib/types/ui";
import { BRAIN_SEARCH_KEYWORDS } from "./static-config";
import {
  mapMemoryItemToUi,
  mapResearchQueueRecordToUi,
  mapSkillDefinitionToUi,
} from "./mappers";

function buildCategoriesFromKnowledge(
  knowledge: Awaited<ReturnType<Repositories["knowledge"]["getAll"]>>,
) {
  const counts = new Map<string, number>();
  for (const item of knowledge) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  return [...counts.entries()].map(([name, itemCount]) => ({
    id: `cat-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    description: `${itemCount} item${itemCount === 1 ? "" : "s"} in this category`,
    searchTags: [name],
    itemCount,
  }));
}

export async function assembleExecutiveBrainData(
  userId: string,
  repos: Repositories,
): Promise<ExecutiveBrainData> {
  const [knowledge, memoryRows, queueRows, skillsRows, activity, userTrustedSources] =
    await Promise.all([
      repos.knowledge.getAll(userId),
      repos.memory.getAll(userId),
      repos.researchQueue.listPending(userId),
      repos.skills.listSkills(userId),
      repos.brainActivity.list(userId),
      repos.trustedSources.listForUser(userId),
    ]);

  const memory = memoryRows
    .filter((item) => item.status !== "archived")
    .map(mapMemoryItemToUi);

  const researchQueue = queueRows.map(mapResearchQueueRecordToUi);
  const skills = skillsRows.map((skill) => mapSkillDefinitionToUi(skill));
  const hasUserContent =
    knowledge.length > 0 ||
    memory.length > 0 ||
    researchQueue.length > 0 ||
    skills.filter((skill) => skill.status === "active").length > 0;

  const activeSkills = skills.filter((skill) => skill.status === "active").length;
  const brainHealth = hasUserContent
    ? Math.min(99, 55 + Math.min(knowledge.length + memory.length, 40))
    : 0;

  return {
    overview: {
      knowledgeItems: knowledge.length,
      executiveMemories: memory.length,
      skills: activeSkills,
      trustedSources: userTrustedSources.length,
      researchWaiting: researchQueue.length,
      brainHealth,
      estimatedTimeSavedHours: hasUserContent ? Math.min(20, knowledge.length * 0.5) : 0,
    },
    trustedSources: userTrustedSources.map((source) => ({
      id: source.id,
      name: source.name,
      category: source.category,
      description: source.description,
      searchTags: [...source.searchTags],
    })),
    researchQueue,
    categories: buildCategoriesFromKnowledge(knowledge),
    memory,
    skills,
    activity,
    isEmpty: !hasUserContent,
  };
}

export { BRAIN_SEARCH_KEYWORDS };
