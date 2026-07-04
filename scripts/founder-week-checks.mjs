/**
 * Lightweight automated checks for Founder Week readiness.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

assert.match(read("lib/security/origin-check.ts"), /x-forwarded-host/);
assert.match(read("lib/executive-dna/discovery-interview-service.ts"), /Auto-save the user's answer/);
assert.match(read("lib/ai/hardened-chat.ts"), /createHardenedChatCompletion/);
assert.match(read("lib/navigation.ts"), /Talk to Kita/);
assert.doesNotMatch(read("lib/ai/generate-brief-action.ts"), /mockExecutiveTasks/);
assert.doesNotMatch(read("lib/ai/OpenAIProvider.ts"), /aviation training, proposals/);

console.log("Founder Week checks passed.");
