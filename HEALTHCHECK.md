# KitaSettle Alpha — Health Check & System Status

## System status

| Component | Status | Mode |
|-----------|--------|------|
| Web application (Next.js) | Operational | Production-ready build |
| Executive Dashboard | Operational | Mock data |
| Executive Brain UI | Operational | Client-side state |
| Authentication | Operational | Mock (session storage) |
| Knowledge Engine | Operational | In-memory mock |
| Memory Engine | Operational | In-memory mock |
| Research Queue | Operational | In-memory mock |
| Live Research Pipeline | Operational | Local JSON mock |
| AI Provider | Operational | Mock only |
| Multi-Agent Orchestrator | Operational | Mock only |
| External APIs | Not connected | By design (Alpha) |
| Database | Not connected | By design (Alpha) |

### Health endpoint

```
GET /api/health
```

Returns JSON with service status, environment, module states, and known limitations.

Example response:

```json
{
  "status": "ok",
  "service": "KitaSettle Alpha",
  "environment": "alpha",
  "nodeEnv": "production",
  "timestamp": "2026-07-01T12:00:00.000Z",
  "modules": {
    "ui": "operational",
    "executiveBrain": "operational",
    "knowledgeEngine": "mock",
    "memoryEngine": "mock",
    "researchPipeline": "mock",
    "aiProvider": "mock",
    "multiAgent": "mock"
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    KitaSettle Alpha UI                   │
│  /login  ·  /dashboard  ·  /knowledge (Executive Brain) │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  Brain Orchestrator                      │
│         Generate Brief · Daily Brief · Agents            │
└──────────────────────────┬──────────────────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
┌────▼────┐  ┌─────────────▼────────────┐  ┌────▼────┐
│Knowledge│  │  Research + Live Pipeline │  │ Memory  │
│ Engine  │  │  Queue · Scheduler · Fetch  │  │ Engine  │
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
```

## Modules

| Module | Path | Purpose |
|--------|------|---------|
| UI | `app/`, `components/` | Pages and premium interface |
| Config | `lib/config/` | Environment and production settings |
| Knowledge | `lib/knowledge/` | Knowledge Engine (mock) |
| Memory | `lib/memory/` | Memory Engine (mock) |
| Skills | `lib/skills/` | Skill registry and execution |
| Brain | `lib/brain/` | Orchestrator, sources, research queue |
| AI | `lib/ai/` | AI provider, brief generation, history |
| Providers | `lib/providers/` | Swappable provider interfaces |
| Research | `lib/research/` | Live research pipeline |
| Agents | `lib/agents/` | Multi-agent framework |
| Executive | `lib/executive/` | Brief generator |
| Health API | `app/api/health/` | Deployment health check |

## Known limitations (Alpha)

1. **Mock authentication** — Any email/password works; session stored in browser only.
2. **No persistent database** — Data resets on serverless cold starts.
3. **No live AI APIs** — All AI responses are mock-generated.
4. **No web scraping** — Research pipeline uses seeded JSON content only.
5. **No real-time sync** — Executive Brain state is per-browser session.
6. **No paid integrations** — Provider adapters are stubbed for future sprints.
7. **Local JSON stores** — `data/research/store/` and `data/store/` are dev/runtime only.

## Alpha roadmap

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 1 | Login, Dashboard, Executive Brief UI | Complete |
| Sprint 2 | Executive Brain UI | Complete |
| Sprint 3 | Executive Brain overview, search, research queue | Complete |
| Sprint 4 | Backend architecture (engines, types, mocks) | Complete |
| Sprint 5 | Live Research pipeline (local JSON) | Complete |
| Sprint 6 | AI provider, brief generation, history | Complete |
| Sprint 7 | Multi-agent orchestrator | Complete |
| Production prep | Build, env, deployment docs | Complete |
| Beta | Real auth, database, AI APIs | Planned |
| GA | Paid integrations, persistence, security hardening | Planned |

## Local validation commands

```bash
npm run validate      # lint + typecheck + build
npm run test:brain    # backend smoke test
npm run research:test # live research pipeline
npm run brief:test    # executive brief generation
npm run agent:test    # multi-agent orchestrator
```

Backend test scripts are development-only and are excluded from the production bundle.
