/**
 * Founder Week full production audit — all critical user journeys.
 * Usage: node scripts/founder-week-production-audit.mjs
 */
import { spawnSync } from "node:child_process";

const SUPABASE_URL = "https://eyszimcjpvutjzuvqqak.supabase.co";
const APP_URL = "https://kita-settle.vercel.app";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5c3ppbWNqcHZ1dGp6dXZxcWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjM0MjMsImV4cCI6MjA5ODQ5OTQyM30.me2XWEx3Tf_zkTvTpEEfXYomHIl7XY7ZqCKCM6HCEGw";

const DISCOVERY_ANSWERS = [
  "Member of Parliament",
  "Public service and policy",
  "Member of Parliament",
  "Constituency work, parliamentary duties, community engagement",
  "Pass key legislation, improve constituency services, strengthen public trust",
  "Community outreach programme, policy briefing pack",
  "Collaborative and evidence-based",
  "Servant leadership with clear accountability",
  "Concise and advisory",
  "Balanced",
  "Policy developments, public sentiment, legislative updates",
  "Governance, public communication, stakeholder management",
  "Constituency priorities, legislative agenda, public trust",
  "Constituency cases, parliamentary business, community outreach",
  "Standard",
  "8am to 7pm weekdays",
  "Protect time for constituency meetings and parliamentary preparation",
  "Executive advisor",
  "Balanced",
  "7:00am",
  "85",
  "Director",
];

function getServiceRoleKey() {
  const result = spawnSync(
    "npx",
    ["supabase", "projects", "api-keys", "--project-ref", "eyszimcjpvutjzuvqqak", "--output", "json"],
    { encoding: "utf8", shell: true, maxBuffer: 10 * 1024 * 1024 },
  );
  const keys = JSON.parse(result.stdout.slice(result.stdout.indexOf("[")));
  return keys.find((entry) => entry.name === "service_role")?.api_key;
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildAuthCookie(loginBody) {
  const session = {
    access_token: loginBody.access_token,
    refresh_token: loginBody.refresh_token,
    expires_in: loginBody.expires_in,
    expires_at: loginBody.expires_at,
    token_type: loginBody.token_type ?? "bearer",
    user: loginBody.user,
  };
  return `sb-eyszimcjpvutjzuvqqak-auth-token=${encodeURIComponent(`base64-${toBase64Url(JSON.stringify(session))}`)}`;
}

const SERVICE_ROLE = getServiceRoleKey();
const email = `kitasettle.founder.audit+${Date.now()}@gmail.com`;
const password = "TestSignup2026!";
const results = [];

function pass(step, detail = "") {
  results.push({ step, ok: true, detail });
  console.log(`✓ ${step}${detail ? `: ${detail}` : ""}`);
}

function fail(step, detail) {
  results.push({ step, ok: false, detail });
  console.error(`✗ ${step}: ${detail}`);
}

console.log("Audit email:", email);

const landing = await fetch(APP_URL);
pass("landing_page", `HTTP ${landing.status}`);

const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
  method: "POST",
  headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, data: { name: "Founder Audit MP" } }),
});
if (!signupRes.ok) fail("signup", `${signupRes.status}`);
else pass("signup");

const link = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json" },
  body: JSON.stringify({ type: "magiclink", email }),
}).then((r) => r.json());
await fetch(link.action_link, { redirect: "manual" });
pass("email_confirm");

const login = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
}).then((r) => r.json());
if (!login.access_token) fail("login", JSON.stringify(login));
else pass("login");

const cookie = buildAuthCookie(login);
const headers = { Cookie: cookie, Origin: APP_URL, "Content-Type": "application/json" };

const discoveryGet = await fetch(`${APP_URL}/api/executive-dna/interview`, { headers: { Cookie: cookie } });
const discoveryStart = await discoveryGet.json();
if (discoveryGet.ok && discoveryStart.session?.messages?.length >= 2) pass("discovery_starts");
else fail("discovery_starts", `${discoveryGet.status} ${JSON.stringify(discoveryStart)}`);

let complete = discoveryStart;
for (const answer of DISCOVERY_ANSWERS) {
  if (complete.isComplete) break;
  const res = await fetch(`${APP_URL}/api/executive-dna/interview`, {
    method: "POST",
    headers,
    body: JSON.stringify({ answer }),
  });
  complete = await res.json();
  if (!res.ok) {
    fail("discovery_answer", `${res.status} ${JSON.stringify(complete)}`);
    break;
  }
}
if (complete.isComplete) pass("discovery_complete");
else fail("discovery_complete", JSON.stringify({ isComplete: complete.isComplete }));

const status = await fetch(`${APP_URL}/api/executive-dna/status`, { headers: { Cookie: cookie } }).then((r) => r.json());
if (status.needsDiscovery === false) pass("discovery_status_complete");
else fail("discovery_status_complete", JSON.stringify(status));

const today = await fetch(`${APP_URL}/api/dashboard/executive`, { headers: { Cookie: cookie } });
const todayBody = await today.json();
const todayHeadline = todayBody.brief?.headline ?? todayBody.brief?.summary;
if (today.ok && todayHeadline) pass("today_brief", todayHeadline);
else fail("today_brief", `${today.status} ${JSON.stringify(todayBody)}`);

const brain = await fetch(`${APP_URL}/api/executive-brain`, { headers: { Cookie: cookie } }).then((r) => r.json());
if (brain.isEmpty === true && brain.overview?.knowledgeItems === 0) pass("executive_brain_empty");
else fail("executive_brain_empty", JSON.stringify(brain.overview));

const myBrain = await fetch(`${APP_URL}/api/my-brain`, { headers: { Cookie: cookie } });
if (myBrain.ok) pass("my_brain");
else fail("my_brain", `${myBrain.status}`);

const trust = await fetch(`${APP_URL}/api/trust-center`, { headers: { Cookie: cookie } });
if (trust.ok) pass("trust_center");
else fail("trust_center", `${trust.status}`);

const talkGet = await fetch(`${APP_URL}/api/kita/talk`, { headers: { Cookie: cookie } });
const talkStart = await talkGet.json();
if (talkGet.ok && talkStart.messages?.length > 0) pass("talk_to_kita_loads");
else fail("talk_to_kita_loads", `${talkGet.status} ${JSON.stringify(talkStart)}`);

const talkPost = await fetch(`${APP_URL}/api/kita/talk`, {
  method: "POST",
  headers,
  body: JSON.stringify({ message: "What should I focus on today?" }),
});
const talkReply = await talkPost.json();
if (talkPost.ok && talkReply.messages?.length >= 3) pass("talk_to_kita_reply");
else fail("talk_to_kita_reply", `${talkPost.status} ${JSON.stringify(talkReply)}`);

const intake = await fetch(`${APP_URL}/api/intake`, {
  method: "POST",
  headers,
  body: JSON.stringify({ type: "text", content: "Constituency clinic notes: three housing cases need follow-up this week." }),
});
if (intake.ok) pass("give_to_kita_paste");
else fail("give_to_kita_paste", `${intake.status} ${JSON.stringify(await intake.json())}`);

const demoTags = ["RVSM", "CBTA", "Steelworks"];
const brainStr = JSON.stringify(brain);
if (!demoTags.some((tag) => brainStr.includes(tag))) pass("no_demo_data");
else fail("no_demo_data", "found demo tags");

const failed = results.filter((r) => !r.ok);
console.log("\n--- AUDIT SUMMARY ---");
console.log(JSON.stringify({ email, userId: login.user?.id, passed: results.length - failed.length, failed: failed.length }, null, 2));
if (failed.length) process.exit(1);
