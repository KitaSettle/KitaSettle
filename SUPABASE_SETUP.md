# Supabase Setup — KitaSettle Alpha

This guide connects KitaSettle to a real Supabase project. Until env vars are configured, the app runs in **mock data mode** with seeded in-memory content (no persistence).

## 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project (choose a region close to your users)
3. Save the database password securely

## 2. Apply database migrations

Migrations live in `supabase/migrations/`:

| File | Purpose |
|------|---------|
| `20260701000001_core_schema.sql` | Core tables: users, knowledge, executive_memory, research_queue, executive_briefs, skills, brain_activity + RLS |
| `20260701000002_seed_and_auth_trigger.sql` | Global skills seed, new-user data seeding, auth trigger |
| `20260701000003_sprint8_foundation.sql` | Sprint 8 views (`profiles`, `knowledge_items`), `trusted_sources` table + seed |

### Option A — Supabase CLI (recommended)

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Option B — SQL Editor

Open **SQL Editor** in the Supabase dashboard and run each migration file in order.

## 3. Configure Auth providers

In **Authentication → Providers**:

- **Email**: enable (required for password sign-in)
- **Google** / **GitHub**: optional OAuth providers

In **Authentication → URL Configuration**, add redirect URLs:

- `http://localhost:3000/api/auth/callback` (local)
- `https://YOUR_VERCEL_DOMAIN/api/auth/callback` (production)

Site URL should match your primary app URL.

## 4. Environment variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Find keys under **Project Settings → API**.

| Variable | Where used |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server (respects RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server scripts only (`npm run test:brain`, etc.) |

**Mock fallback:** If Supabase vars are missing or still set to placeholders, KitaSettle uses mock repositories and sessionStorage auth. Check `/api/health` — `dataMode` will be `"mock"`.

## 5. Vercel deployment

In your Vercel project **Settings → Environment Variables**, add the same three Supabase variables plus:

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_ENV=alpha
```

Redeploy after saving env vars.

## 6. Verify connection

1. Start locally: `npm run dev`
2. Open `/api/health` — expect `"dataMode": "supabase"` and `"supabaseConfigured": true`
3. Sign in at `/login` — new users receive seeded knowledge, memory, research queue, and brief via the `handle_new_user` trigger
4. Confirm data persists after refresh

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `dataMode: mock` in production | Set real Supabase env vars in Vercel and redeploy |
| OAuth redirect error | Add exact callback URL in Supabase Auth settings |
| Empty dashboard after sign-up | Confirm migrations 1–3 ran; check `handle_new_user` trigger exists |
| 401 on API routes (mock mode) | Sign in at `/login` first — mock auth sets a session cookie |
| RLS errors | Ensure user row exists in `public.users` (created by auth trigger) |

## Related docs

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — table and view reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel deployment checklist
- [KITASETTLE.md](./KITASETTLE.md) — operating manual
