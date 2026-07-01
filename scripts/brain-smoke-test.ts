/**
 * Sprint 4 — Executive Brain backend smoke test.
 * Run: npx tsx scripts/brain-smoke-test.ts
 */
import { brainOrchestrator } from "../lib/brain";
import { knowledgeEngine } from "../lib/knowledge";
import { memoryEngine } from "../lib/memory";
import { skillEngine } from "../lib/skills";
import { researchQueueService } from "../lib/brain/research-queue-service";
import { trustedSourceRegistry } from "../lib/brain/source-registry-service";
import { crawlerService } from "../lib/crawler";

async function main() {
  console.log("=== KitaSettle Executive Brain Smoke Test ===\n");

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

  const skillResult = await skillEngine.execute({
    skillId: "skill-summarise-regulation",
    input: { knowledgeIds: ["know-2"] },
  });
  console.log(`Skill execute (mock): ${skillResult.output.message}`);

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

  console.log("\n=== All mock services responded successfully ===");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
