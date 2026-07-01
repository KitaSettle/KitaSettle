/**
 * Sprint 5 — Live Research pipeline test.
 * Run: npm run research:test
 */
import { loadLocalEnv } from "./load-env";
import { getSystemUserId } from "../lib/system-user";
import { createLiveResearchPipeline } from "../lib/research/pipeline/live-research-pipeline";
import { createKnowledgeWriter } from "../lib/research/writer/knowledge-writer";
import { createBrainOrchestrator } from "../lib/brain/brain-orchestrator";

loadLocalEnv();

async function main() {
  console.log("=== KitaSettle Live Research Pipeline Test ===\n");

  const userId = await getSystemUserId();
  const liveResearchPipeline = await createLiveResearchPipeline();
  const result = await liveResearchPipeline.run(new Date());

  console.log(`Sources checked:        ${result.sourcesChecked}`);
  console.log(`Items fetched:          ${result.itemsFetched}`);
  console.log(`Duplicates removed:     ${result.duplicatesRemoved}`);
  console.log(`Research items created: ${result.researchItemsCreated}`);
  console.log(`Ready for approval:     ${result.itemsReadyForApproval}`);

  if (result.sampleSummary) {
    console.log("\nSample executive summary:");
    console.log(`  Summary:            ${result.sampleSummary.summary}`);
    console.log(`  Why it matters:     ${result.sampleSummary.whyItMatters}`);
    console.log(`  Recommended action: ${result.sampleSummary.recommendedAction}`);
    console.log(`  Confidence:         ${result.sampleSummary.confidence}%`);
    console.log(`  Importance:         ${result.sampleSummary.importance}`);
  } else {
    console.log("\nNo executive summary sample available.");
  }

  if (result.findings[0]) {
    console.log("\nSimulating human approval → Knowledge Writer → Executive Brief...");
    const knowledgeWriter = createKnowledgeWriter(userId);
    const brainOrchestrator = await createBrainOrchestrator(userId);
    const knowledgeId = await knowledgeWriter.writeApproved(result.findings[0]);
    const brief = await brainOrchestrator.generateDailyBrief();
    console.log(`  Approved knowledge id: ${knowledgeId}`);
    console.log(`  Executive brief focus: ${brief.recommendedFocus}`);
  }

  console.log("\n=== Live Research pipeline completed successfully ===");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
