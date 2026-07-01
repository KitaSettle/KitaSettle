/**
 * Sprint 6 — Generate Executive Brief test.
 * Run: npm run brief:test
 */
import { loadLocalEnv } from "./load-env";
import { getSystemUserId } from "../lib/system-user";
import { createBrainServices } from "../lib/brain/create-brain-services";
import { createGenerateBriefAction } from "../lib/ai/generate-brief-action";
import { createExecutiveBriefHistoryStore } from "../lib/ai/brief-history-store";

loadLocalEnv();

async function main() {
  console.log("=== KitaSettle Executive Brief Test ===\n");

  const userId = await getSystemUserId();
  const services = await createBrainServices(userId);
  const [research, knowledge, memory] = await Promise.all([
    services.researchQueue.list(),
    services.knowledge.getAll(),
    services.memory.getAll(),
  ]);

  console.log(`Knowledge loaded:   ${knowledge.length} items`);
  console.log(`Research reviewed:  ${research.length} items`);
  console.log(`Memory loaded:      ${memory.length} items`);

  const brief = await createGenerateBriefAction(services, userId).execute();
  const historyStore = await createExecutiveBriefHistoryStore(userId);
  const history = await historyStore.getHistory();

  console.log("\nBrief generated");
  console.log(`Reading time saved: ${brief.estimatedReadingSaved}`);
  console.log(`Confidence:         ${brief.confidence}%`);
  console.log(`Headline:           ${brief.headline}`);
  console.log(`History entries:    ${history.length}`);

  console.log("\n=== Executive Brief test completed successfully ===");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
