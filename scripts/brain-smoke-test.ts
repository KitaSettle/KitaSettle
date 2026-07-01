/**
 * Sprint 4 — Executive Brain backend smoke test.
 * Run: npm run test:brain
 */
import { loadLocalEnv } from "./load-env";
import { getSystemUserId } from "../lib/system-user";
import { createBrainOrchestrator } from "../lib/brain/brain-orchestrator";
import { createKnowledgeEngine } from "../lib/knowledge/knowledge-engine";
import { createMemoryEngine } from "../lib/memory/memory-engine";
import { createSkillEngine } from "../lib/skills/skill-engine";
import { createResearchQueueService } from "../lib/brain/research-queue-service";
import { trustedSourceRegistry } from "../lib/brain/source-registry-service";
import { crawlerService } from "../lib/crawler";

loadLocalEnv();

async function main() {
  console.log("=== KitaSettle Executive Brain Smoke Test ===\n");

  const userId = await getSystemUserId();
  const knowledgeEngine = await createKnowledgeEngine(userId);
  const memoryEngine = await createMemoryEngine(userId);
  const skillEngine = await createSkillEngine(userId);
  const researchQueueService = await createResearchQueueService(userId);
  const brainOrchestrator = await createBrainOrchestrator(userId);

  const knowledge = await knowledgeEngine.getAll();
  console.log(`Knowledge Engine: ${knowledge.length} items`);

  const cbtaResults = await knowledgeEngine.search({ tags: ["CBTA"] });
  console.log(`  CBTA search: ${cbtaResults.length} matches`);

  const memory = await memoryEngine.getAll();
  console.log(`Memory Engine: ${memory.length} items`);

  const skills = await skillEngine.getEnabledSkills();
  console.log(`Skill Engine: ${skills.length} enabled skills`);

  const sources = await trustedSourceRegistry.getEnabled();
  console.log(`Trusted Sources: ${sources.length} enabled sources`);

  const queue = await researchQueueService.list();
  console.log(`Research Queue: ${queue.length} items`);
  const ready = await researchQueueService.listByStatus("Ready");
  console.log(`  Ready: ${ready.length}`);

  if (skills[0]) {
    const skillResult = await skillEngine.execute({
      skillId: skills[0].id,
      input: { knowledgeIds: knowledge.slice(0, 1).map((item) => item.id) },
    });
    console.log(`Skill execute: ${skillResult.output.message}`);
  }

  const brief = await brainOrchestrator.generateDailyBrief();
  console.log(`\nExecutive Brief:`);
  console.log(`  Summary: ${brief.summary}`);
  console.log(`  Priorities: ${brief.topPriorities.length}`);
  console.log(`  Risks: ${brief.risks.length}`);
  console.log(`  Opportunities: ${brief.opportunities.length}`);
  console.log(`  Focus: ${brief.recommendedFocus}`);
  console.log(`  Workload: ${brief.estimatedWorkload}`);

  const job = await crawlerService.schedule("src-icao");
  const crawlResult = await crawlerService.run(job.id);
  console.log(`\nCrawler (mock): ${crawlResult.itemsDiscovered} items from ${job.sourceName}`);

  console.log("\n=== Supabase-backed services responded successfully ===");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
