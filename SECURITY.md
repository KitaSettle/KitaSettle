# KitaSettle Security

This document describes how KitaSettle protects user data, authentication boundaries, and known security limitations for the alpha/beta release.

## Data Protection

- **Storage:** User data is stored in Supabase (PostgreSQL) with Row Level Security (RLS) enabled on all user-scoped tables.
- **Transport:** Production traffic is served over HTTPS with HSTS enabled.
- **Secrets:** Server-only environment variables (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_SECRET`) are never exposed to the browser. The app validates at startup that no `NEXT_PUBLIC_*` variant of these keys is set.
- **OAuth tokens:** Google OAuth access and refresh tokens are stored in `integration_connection_secrets`, a table with RLS enabled and **no user policies**. Only the Supabase service role (server-side) can read or write tokens.
- **Logging:** Application logs redact emails, tokens, API keys, and document bodies. See `lib/security/logger.ts`.

## Authentication Model

- **Production:** Supabase Auth (email/OAuth). All API routes except `/api/health`, `/api/auth/callback`, `/api/auth/account-hint`, and `/api/integrations/google/callback` require an authenticated session.
- **Audit logs:** Written with the service role only; user JWTs cannot insert audit rows.
- **Development:** Mock auth is available when Supabase is not configured. Mock auth is **disabled in production**.
- **Session handling:** Sessions are managed by Supabase SSR cookies. API routes call `requireAuthUserId()` or `requireAuthenticatedUser()` before accessing user data.

## Row Level Security (RLS)

Every user-owned table enforces `auth.uid() = user_id` (or equivalent) for SELECT, INSERT, UPDATE, and DELETE as appropriate. Scoped resources include:

| Domain | Tables |
|--------|--------|
| Executive DNA | `executive_dna_*` |
| Memory & knowledge | `executive_memory`, `knowledge` |
| Research | `research_queue`, `trusted_sources` |
| Briefs & brain | `executive_briefs`, `brain_activity`, `skills` |
| Integrations | `integration_connections`, `calendar_events`, `email_metadata`, `document_index`, `sync_jobs` |
| Decisions | `decision_*` |
| Audit | `audit_logs` (users can read/insert own entries only) |

**Exception:** `integration_connection_secrets` has no user policies by design — tokens are server-only.

## API Key Handling

| Key | Exposure | Usage |
|-----|----------|-------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe | Client Supabase queries under RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | OAuth token storage, admin scripts |
| `OPENAI_API_KEY` | Server only | AI generation routes |
| `GOOGLE_CLIENT_ID` | Server only | OAuth initiation |
| `GOOGLE_CLIENT_SECRET` | Server only | OAuth token exchange |

## User Data Boundaries

- Users can only read and mutate their own rows via RLS-enforced Supabase clients.
- API routes derive `userId` from the authenticated session; client-supplied user IDs are never trusted.
- AI prompts wrap external/untrusted content (emails, documents, research, uploads) in delimited blocks and instruct the model not to follow embedded instructions.

## Rate Limiting

In-memory rate limits apply to sensitive routes:

| Bucket | Limit | Routes |
|--------|-------|--------|
| `ai` | 20/min | Interview answers, executive brief generation |
| `auth` | 10/min | Login callback |
| `integration` | 15/min | Google connect/sync/OAuth |
| `mutation` | 60/min | General authenticated mutations |

> **Note:** In-memory limits reset on cold starts in serverless deployments. For production scale, migrate to Redis or Vercel KV.

## Audit Logging

Security events are written to `audit_logs`:

- Login success
- Data access (list/read on sensitive resources)
- Integration connect/disconnect
- AI generation
- Approval/rejection (research queue, decisions)
- Deletion
- Rate-limit blocks

Retention: **90 days** (see `lib/security/data-retention.ts`).

## Security Headers

Configured in `lib/config/production.ts`:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera, microphone, geolocation disabled)

## Input Validation

API mutation bodies are validated with Zod schemas in `lib/security/validation.ts` before processing.

## Known Limitations

1. **Rate limiting** is per-instance, not global across Vercel regions/instances.
2. **Prompt injection** mitigation reduces risk but cannot guarantee immunity against adversarial content in emails/documents.
3. **Audit log purge** requires a scheduled job (not yet automated in Vercel cron).
4. **CSP** allows `'unsafe-inline'` and `'unsafe-eval'` for Next.js compatibility — tighten when feasible.
5. **Research crawler** uses seeded content; live web crawling introduces additional untrusted-input surface when enabled.
6. **Beta scope:** No SOC 2, penetration test, or formal DPA yet.

## Reporting Issues

Report security concerns privately to the project maintainer before public disclosure.
