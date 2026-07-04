/**
 * Founder Week production E2E: signup → confirm → login → discovery → empty brain.
 */
import { spawnSync } from "node:child_process";

const SUPABASE_URL = "https://eyszimcjpvutjzuvqqak.supabase.co";
const APP_URL = "https://kita-settle.vercel.app";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5c3ppbWNqcHZ1dGp6dXZxcWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjM0MjMsImV4cCI6MjA5ODQ5OTQyM30.me2XWEx3Tf_zkTvTpEEfXYomHIl7XY7ZqCKCM6HCEGw";

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
const signupUserId = signupBody.user?.id;
if (signupUserId) pass("signup_user_id", signupUserId);

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

const accessToken = loginBody.access_token;
const userIdFromLogin = loginBody.user?.id;
if (!userIdFromLogin) fail("auth.users", "missing id from login");
else pass("auth.users", userIdFromLogin);

const session = {
  access_token: loginBody.access_token,
  refresh_token: loginBody.refresh_token,
  expires_in: loginBody.expires_in,
  expires_at: loginBody.expires_at,
  token_type: loginBody.token_type ?? "bearer",
  user: loginBody.user,
};

function toBase64Url(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const projectRef = "eyszimcjpvutjzuvqqak";
const cookieValue = `base64-${toBase64Url(JSON.stringify(session))}`;
const authCookie = `sb-${projectRef}-auth-token=${encodeURIComponent(cookieValue)}`;

const statusRes = await fetch(`${APP_URL}/api/executive-dna/status`, {
  headers: { Cookie: authCookie },
});
const statusBody = await statusRes.json();
if (statusRes.ok && statusBody.needsDiscovery === true) {
  pass("executive_dna_status", `needsDiscovery=${statusBody.needsDiscovery}`);
} else {
  fail("executive_dna_status", `${statusRes.status} ${JSON.stringify(statusBody)}`);
}

let interviewOk = false;
for (let attempt = 1; attempt <= 3; attempt += 1) {
  const interviewRes = await fetch(`${APP_URL}/api/executive-dna/interview`, {
    headers: { Cookie: authCookie },
  });
  const interviewBody = await interviewRes.json();
  if (interviewRes.ok && interviewBody.session?.messages?.length > 0) {
    pass("discovery_starts", `${interviewBody.session.messages.length} messages`);
    interviewOk = true;
    break;
  }
  await new Promise((r) => setTimeout(r, 500 * attempt));
  if (attempt === 3) {
    fail("discovery_starts", `${interviewRes.status} ${JSON.stringify(interviewBody)}`);
  }
}

const brainRes = await fetch(`${APP_URL}/api/executive-brain`, {
  headers: { Cookie: authCookie },
});
const brainBody = await brainRes.json();
if (
  brainRes.ok &&
  brainBody.overview?.knowledgeItems === 0 &&
  brainBody.overview?.executiveMemories === 0 &&
  brainBody.overview?.skills === 0 &&
  brainBody.overview?.trustedSources === 0 &&
  brainBody.isEmpty === true
) {
  pass("executive_brain_empty", "all counts zero");
} else {
  fail("executive_brain_empty", `${brainRes.status} ${JSON.stringify(brainBody.overview ?? brainBody)}`);
}

const knowledgeCount = await restCount("knowledge", userIdFromLogin);
const memoryCount = await restCount("executive_memory", userIdFromLogin);
const researchCount = await restCount("research_queue", userIdFromLogin);
if (knowledgeCount === 0 && memoryCount === 0 && researchCount === 0) {
  pass("db_empty", `knowledge=${knowledgeCount} memory=${memoryCount} research=${researchCount}`);
} else {
  fail("db_empty", `knowledge=${knowledgeCount} memory=${memoryCount} research=${researchCount}`);
}

const demoTags = ["RVSM", "CBTA", "Steelworks"];
const hasDemo =
  (brainBody.memory ?? []).some((m) => demoTags.some((t) => JSON.stringify(m).includes(t))) ||
  (brainBody.researchQueue ?? []).some((m) => demoTags.some((t) => JSON.stringify(m).includes(t)));
if (!hasDemo) pass("no_demo_data", "no aviation/steelworks in brain payload");
else fail("no_demo_data", "found demo tags in brain payload");

const failed = results.filter((r) => !r.ok);
console.log("\n--- SUMMARY ---");
console.log(JSON.stringify({ email, userId: userIdFromLogin, passed: results.filter((r) => r.ok).length, failed: failed.length, interviewOk }, null, 2));
if (failed.length) process.exit(1);
