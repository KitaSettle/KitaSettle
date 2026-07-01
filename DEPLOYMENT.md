# KitaSettle Alpha — Deployment Guide

This guide covers deploying KitaSettle Alpha to production on [Vercel](https://vercel.com).

## Prerequisites

- Node.js 18.18 or later
- A Vercel account connected to your Git repository
- Environment variables configured (see below)

## Deploy to Vercel

### Option A — Vercel Dashboard (recommended)

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, click **Add New Project** and import the repository.
3. Vercel auto-detects Next.js. Confirm these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` |
| **Install Command** | `npm install` |
| **Output Directory** | *(leave default — Vercel manages Next.js output)* |
| **Node.js Version** | 20.x (recommended) |

4. Add environment variables from `.env.example`.
5. Click **Deploy**.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Required environment variables

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | Yes | `KitaSettle Alpha` | Application title |
| `NEXT_PUBLIC_APP_ENV` | Yes | `alpha` | Environment label |
| `NEXT_PUBLIC_APP_URL` | Yes (production) | `https://your-app.vercel.app` | Public site URL |
| `NODE_ENV` | Auto | `production` | Set by Vercel automatically |

Optional future keys (not used in Alpha):

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_AI_API_KEY`

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

## Build command

```bash
npm run build
```

Validate locally before deploying:

```bash
npm run validate
```

This runs lint, TypeScript check, and production build.

## Output directory

KitaSettle uses the **Next.js App Router** with server-side rendering. Vercel handles output automatically — there is no static `out/` folder to configure for standard deployment.

For a static export (not currently configured), you would set `output: 'export'` in `next.config.ts`. Alpha does **not** use static export.

Production artifacts:

- `.next/` — build output (generated locally; not committed)
- Serverless functions for `/api/health` and App Router pages

## Verify deployment

After deploy, confirm:

1. **Home** redirects to `/login` or `/dashboard`
2. **Health check**: `GET /api/health` returns `{ "status": "ok" }`
3. Pages load: `/login`, `/dashboard`, `/knowledge`

Example:

```bash
curl https://your-app.vercel.app/api/health
```

## How to update deployment

### Automatic (recommended)

Connect your production branch (e.g. `main`) to Vercel. Every push triggers a new deployment.

### Manual redeploy

1. Vercel Dashboard → your project → **Deployments**
2. Click **Redeploy** on the latest deployment, or
3. Run `vercel --prod` from your project directory

### Rollback

1. Vercel Dashboard → **Deployments**
2. Select a previous successful deployment
3. Click **Promote to Production**

## Production notes (Alpha)

- Authentication is mock-only (session storage). Do not treat this as production-grade security.
- AI, research, and knowledge backends use in-memory mock services.
- Runtime JSON stores under `data/` are not persisted on Vercel serverless by default.
- No paid API keys are required for Alpha deployment.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on env | Set `NEXT_PUBLIC_APP_URL` in Vercel project settings |
| 404 on routes | Ensure App Router pages exist under `app/` |
| Type errors | Run `npm run typecheck` locally before pushing |
| Lint failures | Run `npm run lint` locally |
