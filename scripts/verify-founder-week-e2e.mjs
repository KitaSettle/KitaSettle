/**
 * Founder Week production E2E:
 * signup → confirm → login → discovery start → complete full interview.
 */
import { spawnSync } from "node:child_process";

const SUPABASE_URL = "https://eyszimcjpvutjzuvqqak.supabase.co";
const APP_URL = "https://kita-settle.vercel.app";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5c3ppbWNqcHZ1dGp6dXZxcWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjM0MjMsImV4cCI6MjA5ODQ5OTQyM30.me2XWEx3Tf_zkTvTpEEfXYomHIl7XY7ZqCKCM6HCEGw";

const DISCOVERY_ANSWERS = [
  "CEO and founder",
  "Technology and professional services",
  "Chief Executive Officer",
  "Strategy, product direction, client relationships",
  "Grow revenue, improve team execution, launch new product line",
  "Platform launch, hiring plan, Q3 roadmap",
  "Collaborative and analytical",
  "Servant leadership with clear accountability",
  "Concise and advisory",
  "Balanced",
  "Market trends, competitor moves, regulatory changes",
  "Leadership, product strategy, AI tools",
  "Growth, hiring, customer success",
  "Revenue, product delivery, team health",
  "Standard",
  "9am to 6pm weekdays",
  "Batch non-urgent meetings, protect focus blocks",
  "Executive advisor",
  "Balanced",
  "7:30am",
  "85",
  "Founder",
];

function getServiceRoleKey() {
  const result = spawnSync(
    "npx",
    ["supabase", "projects", "api-keys", "--project-ref", "eyszimcjpvutjzuvqqak", "--output", "json"],
    { encoding: "utf8", shell: true, maxBuffer: 10 * 1024 * 1024 },
  );
  const text = result.stdout ?? "";
  const start = text.indexOf("[");
  if (start === -1) throw new Error("Could not load Supabase service role key");
  const keys = JSON.parse(text.slice(start));
  const key = keys.find((entry) => entry.name === "service_role")?.api_key;
  if (!key) throw new Error("Service role key missing");
  return key;
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
  const projectRef = "eyszimcjpvutjzuvqqak";
  const cookieValue = `base64-${toBase64Url(JSON.stringify(session))}`;
  return `sb-${projectRef}-auth-token=${encodeURIComponent(cookieValue)}`;
}

const SERVICE_ROLE = getServiceRoleKey();
const email = `kitasettle.founder.week+${Date.now()}@gmail.com`;
const password = "TestSignup2026!";
const redirectTo = `${APP_URL}/auth/callback?next=%2Fdashboard%2Fdiscovery`;

const results = [];

function pass(step, detail = "") {
  results.push({ step, ok: true, detail });
  console.log(`✓ ${step}${detail ? `: ${detail}` : ""}`);
}

function fail(step, detail) {
  results.push({ step, ok: false, detail });
  console.error(`✗ ${step}: ${detail}`);
}

async function restCount(table, userId) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}&select=id`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      Prefer: "count=exact",
    },
  });
  const range = res.headers.get("content-range") ?? "";
  const match = range.match(/\/(\d+)$/);
  return match ? Number(match[1]) : (await res.json()).length;
}

console.log("Test email:", email);

const signupRes = await fetch(
  `${SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`,
  {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      data: { name: "Founder Week E2E" },
    }),
  },
);
const signupBody = await signupRes.json();
if (!signupRes.ok) {
  fail("signup", `${signupRes.status} ${JSON.stringify(signupBody)}`);
  process.exit(1);
}
pass("signup", signupBody.user?.confirmation_sent_at ? "confirmation sent" : "user created");

const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "magiclink",
    email,
    options: { redirect_to: redirectTo },
  }),
});
const linkBody = await linkRes.json();
const actionLink = linkBody.action_link ?? linkBody.actionLink;
if (!linkRes.ok || !actionLink) {
  fail("email_confirm", `${linkRes.status} ${JSON.stringify(linkBody)}`);
} else {
  const confirmRes = await fetch(actionLink, { redirect: "manual" });
  pass("email_confirm", `HTTP ${confirmRes.status}`);
}

const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
});
const loginBody = await loginRes.json();
if (!loginRes.ok || !loginBody.access_token) {
  fail("login", `${loginRes.status} ${JSON.stringify(loginBody)}`);
  process.exit(1);
}
pass("login", "access_token received");

const userId = loginBody.user?.id;
if (!userId) fail("auth.users", "missing id from login");
else pass("auth.users", userId);

const authCookie = buildAuthCookie(loginBody);
const authHeaders = {
  Cookie: authCookie,
  Origin: APP_URL,
  "Content-Type": "application/json",
};

const startRes = await fetch(`${APP_URL}/api/executive-dna/interview`, {
  headers: { Cookie: authCookie },
});
const startBody = await startRes.json();
if (!startRes.ok || !startBody.session?.messages?.length) {
  fail("discovery_starts", `${startRes.status} ${JSON.stringify(startBody)}`);
} else {
  pass("discovery_starts", `${startBody.session.messages.length} messages`);
}

let interviewState = startBody;
let answersSubmitted = 0;

for (const answer of DISCOVERY_ANSWERS) {
  if (interviewState?.isComplete) break;

  const postRes = await fetch(`${APP_URL}/api/executive-dna/interview`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ answer }),
  });
  const postBody = await postRes.json();

  if (!postRes.ok) {
    fail("discovery_answer", `#${answersSubmitted + 1} HTTP ${postRes.status} ${JSON.stringify(postBody)}`);
    break;
  }

  answersSubmitted += 1;
  interviewState = postBody;

  if (postBody.isComplete) {
    pass("discovery_complete", `after ${answersSubmitted} answers, confidence=${postBody.overallConfidence}`);
    break;
  }
}

if (!interviewState?.isComplete) {
  fail("discovery_complete", `still incomplete after ${answersSubmitted} answers`);
}

const statusRes = await fetch(`${APP_URL}/api/executive-dna/status`, {
  headers: { Cookie: authCookie },
});
const statusBody = await statusRes.json();
if (statusRes.ok && statusBody.needsDiscovery === false) {
  pass("executive_dna_status_complete", `needsDiscovery=${statusBody.needsDiscovery}`);
} else {
  fail("executive_dna_status_complete", `${statusRes.status} ${JSON.stringify(statusBody)}`);
}

const brainRes = await fetch(`${APP_URL}/api/executive-brain`, {
  headers: { Cookie: authCookie },
});
const brainBody = await brainRes.json();
if (
  brainRes.ok &&
  brainBody.overview?.knowledgeItems === 0 &&
  brainBody.overview?.executiveMemories === 0
) {
  pass("executive_brain_empty", "still empty after discovery");
} else {
  fail("executive_brain_empty", `${brainRes.status} ${JSON.stringify(brainBody.overview ?? brainBody)}`);
}

const knowledgeCount = await restCount("knowledge", userId);
const memoryCount = await restCount("executive_memory", userId);
if (knowledgeCount === 0 && memoryCount === 0) {
  pass("db_empty", `knowledge=${knowledgeCount} memory=${memoryCount}`);
} else {
  fail("db_empty", `knowledge=${knowledgeCount} memory=${memoryCount}`);
}

const failed = results.filter((r) => !r.ok);
console.log("\n--- SUMMARY ---");
console.log(JSON.stringify({ email, userId, answersSubmitted, passed: results.filter((r) => r.ok).length, failed: failed.length }, null, 2));
if (failed.length) process.exit(1);
