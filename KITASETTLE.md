# KitaSettle — Permanent Operating Manual

This document is the authoritative reference for every future sprint. When in doubt, follow KITASETTLE.md before improvising.

**Repository:** https://github.com/KitaSettle/KitaSettle  
**Founder:** Dan  
**Working product name:** KitaSettle Alpha  
**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Supabase · Vercel

---

## Project Vision

KitaSettle exists because professionals should not have to carry every decision, responsibility, and problem alone.

The company gives busy decision makers an AI-powered executive workforce that prepares, analyses, organises, and recommends — so the founder can focus on leadership.

### North Star

Every professional deserves the confidence of having an executive team behind them.

### Core Promise

Wake up knowing exactly what deserves your attention.

### Emotional Outcome

Every feature must help the user feel:

- Relief
- Clarity
- Confidence
- Freedom
- Optimism
- Control

### Non-Negotiables

KitaSettle must never:

- Invent facts
- Send emails without approval
- Change financial data automatically
- Make big decisions without human approval

**AI prepares. The founder decides.**

---

## Product Mission

KitaSettle is **not** an AI chatbot. It is an **Executive Intelligence Platform**.

Its first product is the **Executive Brief**: a daily command-centre view that reduces cognitive load, improves decision quality, and helps the founder focus on what matters.

Every feature must:

1. Reduce cognitive load
2. Improve decision confidence
3. Protect focus
4. Preserve knowledge
5. Be something users would pay for

### Current Product Surface (Alpha)

| Route | Name | Purpose |
|-------|------|---------|
| `/login` | Sign in | Supabase Auth (email, Google, GitHub) |
| `/dashboard` | Executive Dashboard | Daily brief, priorities, risks, opportunities |
| `/knowledge` | Executive Brain | Search, research queue, memory, skills, trusted sources |

### Product Category

Executive Intelligence Platform — hybrid UX: clean and premium at first glance, deeper capability available when needed.

---

## Executive Brain Architecture

The Executive Brain is KitaSettle's knowledge engine. It sits at `/knowledge` in the UI and is backed by modular services in `lib/`.

### High-Level Flow

```
┌─────────────────────────────────────────────────────────┐
│                    KitaSettle UI                         │
│  /login  ·  /dashboard  ·  /knowledge (Executive Brain)│
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              API Layer (app/api/*)                       │
│  executive-brain · knowledge · memory · research-queue   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│           Repository Layer (lib/repositories/)           │
│  Supabase-backed CRUD for all persistent entities        │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  Brain Orchestrator                      │
│    Generate Brief · Daily Brief · Multi-Agent System     │
└──────────────────────────┬──────────────────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
┌────▼────┐  ┌─────────────▼────────────┐  ┌────▼────┐
│Knowledge│  │  Research Pipeline        │  │ Memory  │
│ Engine  │  │  Queue · Scheduler · Fetch │  │ Engine  │
└────┬────┘  └─────────────┬────────────┘  └────┬────┘
     │                     │                     │
     └─────────────────────┼─────────────────────┘
                           │
              ┌────────────▼────────────┐
              │     Provider Layer       │
              │  AI · Search · Crawler   │
              │  Embedding · Memory      │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │   Multi-Agent System     │
              │  8 agents · Orchestrator │
              └─────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │       Supabase           │
              │  Auth · Postgres · RLS   │
              └─────────────────────────┘
```

### Core Modules

| Module | Path | Responsibility |
|--------|------|----------------|
| UI | `app/`, `components/` | Pages and premium interface |
| API | `app/api/` | Authenticated CRUD and aggregation |
| Repositories | `lib/repositories/` | Supabase data access (interfaces + implementations) |
| Supabase | `lib/supabase/` | Client, server, script, middleware clients |
| Config | `lib/config/` | Environment and production settings |
| Knowledge | `lib/knowledge/` | Knowledge Engine |
| Memory | `lib/memory/` | Executive Memory Engine |
| Skills | `lib/skills/` | Skill registry and execution |
| Brain | `lib/brain/` | Orchestrator, sources, research queue |
| AI | `lib/ai/` | AI provider, brief generation |
| Providers | `lib/providers/` | Swappable provider interfaces |
| Research | `lib/research/` | Live research pipeline |
| Agents | `lib/agents/` | Multi-agent framework |
| Executive | `lib/executive/` | Brief generator |
| Executive Brain | `lib/executive-brain/` | UI data assembly and static config |

### Database Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `users` | Profile linked to `auth.users` |
| `knowledge` | Structured knowledge items |
| `executive_memory` | Decisions, notes, captured context |
| `research_queue` | Findings awaiting review (approve/reject persisted) |
| `executive_briefs` | Dashboard executive brief |
| `skills` | Global and user skills |
| `brain_activity` | Activity log for Executive Brain |

Migrations live in `supabase/migrations/`. New users are seeded automatically via the `handle_new_user` trigger.

### Provider Layer

All external capabilities are accessed through interfaces in `lib/providers/`. Current state:

| Provider | Status |
|----------|--------|
| AI | Mock (OpenAI/Claude/Gemini stubs ready) |
| Search | Mock |
| Crawler | Mock (no live scraping yet) |
| Embedding | Mock |
| Memory (vector) | Mock |

Swap providers without changing UI or orchestrator contracts.

---

## Coding Standards

### Language and Framework

- **TypeScript strict mode** — no implicit `any`
- **Next.js App Router** — pages in `app/`, server components by default, `"use client"` only when needed
- **Path alias** — `@/` maps to project root

### Architecture Rules

1. **UI never talks to Supabase directly for domain data** — use API routes or server loaders that call repositories.
2. **Repositories implement interfaces** — engines and services depend on interfaces, not Supabase SDK calls scattered in components.
3. **One responsibility per module** — knowledge, memory, research, skills, and briefs stay in separate `lib/` folders.
4. **Provider injection** — external services (AI, search, crawl) go through `lib/providers/`.
5. **No secrets in client code** — only `NEXT_PUBLIC_*` env vars in browser; service role key is server-only.

### File and Naming Conventions

```
app/                    # Routes and API handlers
components/             # React UI (grouped by feature)
lib/                    # Domain logic, repositories, config
supabase/migrations/    # SQL migrations (versioned, never edit in place)
scripts/                # Dev-only CLI tests (excluded from main tsconfig)
data/                   # Legacy seed/reference data (not primary runtime store)
docs/                   # Product specifications (historical)
```

- **Components:** PascalCase (`ExecutiveBrainContent.tsx`)
- **Lib modules:** kebab-case files, camelCase exports
- **Types:** shared in `lib/types/`; UI-specific types in `lib/types/ui.ts`
- **API routes:** RESTful nouns, actions via PATCH body (`action: "approve"`)

### Change Discipline

- **Minimize scope** — smallest correct diff; do not refactor unrelated code in the same sprint.
- **Match existing conventions** — read surrounding code before writing.
- **No over-engineering** — no abstractions for one-off use.
- **Comments** — only for non-obvious business logic.
- **Tests** — add only when they cover meaningful behaviour; dev scripts in `scripts/` are smoke tests, not unit tests.

### Validation Before Merge

Always run locally before pushing:

```bash
npm run validate    # lint + typecheck + build
```

Individual commands:

```bash
npm run lint
npm run typecheck
npm run build
```

---

## UI Principles

### Design Philosophy

Hybrid: **clean, premium, simple at first glance**, with deeper capability available only when needed.

KitaSettle should feel like a calm executive command centre — not a chatbot, not a cluttered dashboard.

### Non-Negotiable UI Rules

1. **Do not redesign pages mid-sprint** unless the sprint explicitly requires it.
2. **Do not rename routes** without product approval (`/login`, `/dashboard`, `/knowledge`).
3. **Preserve layout structure** — AppShell, Sidebar, section cards, and typography stay consistent.
4. **Reduce cognitive load** — one primary action per section; clear hierarchy.
5. **Premium feel** — generous whitespace, restrained colour (accent sparingly), readable type.

### Component Patterns

- **AppShell** — auth guard + sidebar + main content
- **SectionCard** — titled content blocks on dashboard and Executive Brain
- **Loaders** — `DashboardLoader`, `ExecutiveBrainLoader` fetch from API; show pulse spinner while loading
- **Toasts** — transient feedback for user actions (approve, reject, save)

### Styling

- Tailwind CSS 4 via `app/globals.css`
- Design tokens: `background`, `surface`, `foreground`, `muted`, `accent`, `border`
- Responsive: mobile nav below `lg` breakpoint; sidebar hidden on small screens

### Accessibility

- Form labels on all inputs
- Semantic HTML (`header`, `main`, `aside`)
- Error messages with `role="alert"`

---

## Deployment Workflow

### Environments

| Environment | Branch | Hosting | Database |
|-------------|--------|---------|----------|
| Local | any | `npm run dev` | Supabase dev project or `.env.local` |
| Production | `main` | Vercel | Supabase production project |

### Pre-Deploy Checklist

1. `npm run validate` passes locally
2. Environment variables set in Vercel (see below)
3. Supabase migrations applied
4. Auth redirect URLs configured
5. Smoke test: `/login` → `/dashboard` → `/knowledge` → `/api/health`

### Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_NAME` | Yes | Application title |
| `NEXT_PUBLIC_APP_ENV` | Yes | Environment label (`alpha`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public site URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Service role for scripts/admin |
| `SUPABASE_SYSTEM_USER_ID` | Optional | UUID for CLI test scripts |

Future (not active):

- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`

### Build Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build |
| `npm run start` | Serve production build locally |
| `npm run validate` | Lint + typecheck + build |

Output: Next.js manages `.next/` automatically. No static export.

### Health Check

```bash
curl https://your-app.vercel.app/api/health
```

Expect `"status": "ok"`. See `HEALTHCHECK.md` for full system status reference.

### Rollback

Vercel Dashboard → Deployments → select previous deployment → **Promote to Production**.

---

## Git Workflow

### Repository

- **Remote:** `https://github.com/KitaSettle/KitaSettle.git`
- **Production branch:** `main`
- **Author:** Dan \<dan@kitasettle.com\>

### Branch Strategy

| Branch | Use |
|--------|-----|
| `main` | Production-ready code; auto-deploys to Vercel |
| Feature branches | Optional for larger sprints; merge via PR |

For small sprints, committing directly to `main` is acceptable during Alpha.

### Commit Messages

Use sprint-based messages that describe the milestone:

```
Initial Alpha
Sprint 7
Sprint 8 — Live AI provider
```

Keep messages short and milestone-focused. Do not commit secrets (`.env.local`, service role keys).

### Standard Workflow

```bash
# 1. Validate
npm run validate

# 2. Stage and commit
git add .
git commit -m "Sprint N — short description"

# 3. Push
git push origin main
```

### What Not to Commit

- `.env.local` and any file with secrets
- `node_modules/`, `.next/`
- Runtime stores: `data/research/store/`, `data/store/`

These are listed in `.gitignore`.

---

## Vercel Workflow

### Project Setup

1. Import `KitaSettle/KitaSettle` from GitHub
2. Framework: **Next.js** (auto-detected)
3. Build command: `npm run build`
4. Install command: `npm install`
5. Output directory: leave default
6. Node.js: **20.x**

Configuration is also in `vercel.json`.

### Environment Variables in Vercel

Project Settings → Environment Variables → add all vars from `.env.example`.

Set for **Production** (and Preview if testing PRs):

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_APP_URL` → your Vercel URL (e.g. `https://kitasettle.vercel.app`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Deploy Triggers

| Method | When |
|--------|------|
| Automatic | Every push to `main` |
| Manual | Vercel Dashboard → Redeploy |
| CLI | `vercel --prod` |

### Post-Deploy Verification

1. Visit production URL — redirects to `/login` or `/dashboard`
2. Sign in with Supabase Auth
3. Confirm `/dashboard` loads executive brief from Supabase
4. Confirm `/knowledge` loads Executive Brain from `/api/executive-brain`
5. Approve a research item — confirm it persists after refresh
6. Hit `/api/health`

### Supabase Auth Redirect URLs

Add to Supabase → Authentication → URL Configuration:

```
http://localhost:3000/api/auth/callback
https://your-app.vercel.app/api/auth/callback
```

---

## AI Research Rules

The research pipeline lives in `lib/research/`. It prepares findings for human review — it does not auto-publish to knowledge.

### Pipeline Stages

1. **Scheduler** — determines which trusted sources are due for check
2. **Fetcher** — retrieves source content (currently seeded JSON, not live crawl)
3. **Extractor** — cleans and structures document text
4. **Duplicate detector** — removes already-known items
5. **Classifier** — assigns category, subcategory, tags
6. **Summariser** — produces executive summary, confidence, importance
7. **Reviewer** — submits to research queue with status `Ready`
8. **Human approval** — user approves, rejects, or saves to memory via UI/API
9. **Knowledge writer** — on approval, writes to `knowledge` table

### Research Queue Statuses

`Queued` → `Searching` → `Analysing` → `Ready` → `Approved` | `Rejected`

Only items in pending statuses (`Queued`, `Searching`, `Analysing`, `Ready`) appear in the Executive Brain queue.

### Human-in-the-Loop Rules

1. **Nothing enters executive memory or knowledge without approval** (except seeded onboarding data).
2. **Reject is permanent** — status stored in Supabase; item removed from queue UI.
3. **Approve creates both memory and knowledge** — see `/api/research-queue/[id]` PATCH with `action: "approve"`.
4. **Save to memory** — saves context without removing from queue or creating knowledge.

### Trusted Sources

Static registry in `lib/brain/trusted-source-registry.ts` and `lib/executive-brain/static-config.ts`.

Examples: ICAO, CAAM, FAA, EASA, CIDB, HBR, McKinsey.

Live crawling is **not** enabled. Fetcher uses `data/research/seed/` content until a crawler provider is connected.

### AI Provider Rules (Current)

- All AI responses are **mock-generated** via `MockAIProvider`
- Mock AI must not invent specific regulatory facts — use plausible summaries based on input data
- When connecting real AI (future sprint): pass source documents as context; require citations; never fabricate URLs or dates

### Dev Commands

```bash
npm run research:test   # Full pipeline smoke test
npm run test:brain      # All backend engines
npm run brief:test      # Executive brief generation
npm run agent:test      # Multi-agent orchestrator
```

Requires `.env.local` with Supabase credentials and `SUPABASE_SYSTEM_USER_ID`.

---

## Knowledge Engine Standards

### Purpose

The Knowledge Engine stores structured, searchable business intelligence — regulations, proposals, training content, finance notes.

### Data Model

Defined in `lib/types/knowledge.ts`:

| Field | Description |
|-------|-------------|
| `title`, `summary`, `content` | Human-readable layers |
| `source`, `url` | Origin and link |
| `category`, `subcategory` | Organisation |
| `tags` | Search keywords |
| `confidence` | 0–100 quality score |
| `importance` | `High` \| `Medium` \| `Low` |
| `relatedItems` | Cross-references to other knowledge IDs |
| `publishedDate`, `lastReviewed` | Timestamps |

### Access Pattern

- **Repository:** `lib/repositories/knowledge-repository.ts`
- **Engine:** `lib/knowledge/knowledge-engine.ts` → `createKnowledgeEngine(userId)`
- **API:** `GET/POST /api/knowledge`, `GET/PATCH/DELETE /api/knowledge/[id]`

### Rules

1. Every knowledge item belongs to a user (`user_id` + RLS).
2. Search is keyword/tag based today; vector search is future work.
3. Categories displayed in Executive Brain are derived from knowledge counts + static config.
4. Do not duplicate knowledge on approve — check research queue flow before adding new write paths.
5. Importance and confidence must be set on create; default confidence is not acceptable for production research items.

---

## Memory Standards

### Purpose

Executive Memory preserves decisions, notes, ideas, and captured context — the founder's institutional memory.

### Data Model

Defined in `lib/types/memory.ts`:

| Field | Description |
|-------|-------------|
| `title`, `description` | What was decided or noted |
| `category` | e.g. Decisions, Training, Ideas, Finance, Research |
| `importance` | `High` \| `Medium` \| `Low` |
| `status` | `active` \| `archived` \| `pending` |
| `relatedKnowledge` | Links to knowledge item IDs |
| `searchTags` | UI search keywords |

UI displays `description` as `snippet` and formats `createdAt` as a display date.

### Access Pattern

- **Repository:** `lib/repositories/memory-repository.ts`
- **Engine:** `lib/memory/memory-engine.ts` → `createMemoryEngine(userId)`
- **API:** `GET/POST /api/executive-memory`, `GET/PATCH/DELETE /api/executive-memory/[id]`

### Rules

1. Memory is user-scoped with RLS — never expose another user's memory.
2. **Archive, don't delete** — DELETE route archives (`status: archived`).
3. Research approvals write memory with category `"Research"` and tags from the research item.
4. Executive Brain hides archived items from the memory list.
5. Memory items should be concise — title + 1–3 sentence description; long content belongs in knowledge.

---

## Future Roadmap

### Completed Sprints

| Sprint | Focus |
|--------|-------|
| 1 | Login, Dashboard, Executive Brief UI |
| 2 | Executive Brain UI |
| 3 | Overview, search, research queue interactions |
| 4 | Backend architecture (engines, types, mocks) |
| 5 | Live Research pipeline (local JSON) |
| 6 | AI provider, brief generation, history |
| 7 | Supabase persistence, Auth, API CRUD, repositories |
| Production prep | Build, env, deployment docs |

### Beta (Next)

- Connect live AI provider (OpenAI or Claude)
- Real web crawler (Firecrawl or equivalent)
- Editable executive brief
- PDF upload and document ingestion
- Vector search on knowledge
- Invite 5–10 founder testers

### v1 (Paid Product)

- AI-generated daily brief from live data
- Calendar integration
- Email digest (with approval)
- Task recommendations
- Subscription billing (Stripe)
- Multi-user teams

### Future Modules

- Aviation module (CBTA, RVSM, CAAM compliance)
- Engineering / construction module
- Finance capability
- WhatsApp interface
- Mobile app

### Technical Debt to Address

- Update `README.md` and `HEALTHCHECK.md` to reflect Supabase (currently stale)
- Replace mock AI provider with production adapter
- Enable live crawler provider
- Add automated test suite (beyond smoke scripts)
- Rate limiting on API routes
- Audit logging for approve/reject actions

---

## Quick Reference

### Key Commands

```bash
npm run dev          # Local development
npm run validate     # Pre-push validation
npm run test:brain   # Backend smoke test
```

### Key Files

| File | Purpose |
|------|---------|
| `KITASETTLE.md` | This operating manual |
| `DEPLOYMENT.md` | Vercel deploy guide |
| `HEALTHCHECK.md` | System status and architecture |
| `.env.example` | Environment variable template |
| `vercel.json` | Vercel build config |
| `middleware.ts` | Supabase session refresh |

### Support Documents

Product specifications remain in `docs/` (Genesis, PRD, Architecture, UX Blueprint, Roadmap). KITASETTLE.md supersedes them for **engineering and sprint operations**. Refer to `docs/` for product narrative and positioning detail.

---

*Last updated: Sprint 7 — Supabase persistence, Supabase Auth, repository layer, API CRUD.*
