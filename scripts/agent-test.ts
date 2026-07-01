/**
 * Sprint 7 — Multi-Agent Executive Brain test.
 * Run: npm run agent:test
 */
import { createBrainServices } from "../lib/brain/create-brain-services";
import { createAgentOrchestrator } from "../lib/agents";

async function main() {
  console.log("=== KitaSettle Multi-Agent Executive Brain Test ===\n");

  const services = createBrainServices();
  const orchestrator = createAgentOrchestrator(services);
  const agents = orchestrator.listAgents();

  console.log(`Agents loaded: ${agents.length}`);
  agents.forEach((agent) => {
    console.log(`  - ${agent.name} (${agent.id})`);
  });

  const objective = "What changed in ICAO this week?";
  console.log(`\nTask assigned: "${objective}"`);

  const result = await orchestrator.execute(objective);

  console.log("\nExecution order:");
  result.executionOrder.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });

  console.log(`\nKnowledge used: ${result.knowledgeUsed.length} items`);
  console.log(`Sources used:   ${result.sourcesUsed.join(", ") || "None"}`);
  console.log("\nSummary generated:");
  console.log(result.summary);
  console.log(`\nExecution time: ${result.executionTimeMs}ms`);

  console.log("\n=== Multi-agent test completed successfully ===");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
