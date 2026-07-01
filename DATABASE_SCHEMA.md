# Database Schema — KitaSettle Alpha

KitaSettle uses Supabase (PostgreSQL) with Row Level Security (RLS). Sprint 8 adds canonical naming views and a `trusted_sources` catalog.

## Data mode

| Mode | When | Storage |
|------|------|---------|
| `mock` | Supabase env vars missing or placeholder | In-memory seed data via repository layer |
| `supabase` | Valid `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | PostgreSQL via Supabase |

Check runtime mode: `GET /api/health` → `dataMode`.

---

## Tables

### `users` (profile storage)

Linked 1:1 with `auth.users`. Created automatically on sign-up via trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | FK → `auth.users.id` |
| `name` | text | Display name |
| `email` | text | From auth |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Sprint 8 view:** `profiles` — read-only alias of `users` columns.

---

### `knowledge`

Executive knowledge items per user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | → `users.id` |
| `title`, `summary`, `content` | text | |
| `source`, `url` | text | |
| `category`, `subcategory` | text | |
| `confidence` | integer | 0–100 |
| `published_date`, `last_reviewed` | timestamptz | |
| `related_items` | uuid[] | Cross-references |
| `tags` | text[] | Search tags |
| `importance` | text | High / Medium / Low |

**Sprint 8 view:** `knowledge_items` — read-only alias of full `knowledge` row.

---

### `executive_memory`

Long-lived executive notes and decisions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `title`, `description`, `category` | text | |
| `importance` | text | High / Medium / Low |
| `related_knowledge` | uuid[] | |
| `search_tags` | text[] | |
| `status` | text | active / archived / pending |

---

### `research_queue`

AI-prepared research awaiting executive approval.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `title`, `summary`, `source` | text | |
| `source_url` | text | |
| `confidence` | integer | |
| `importance` | text | |
| `why_it_matters` | text | |
| `status` | text | Queued, Searching, Analysing, Ready, Approved, Rejected |
| `tags` | text[] | |
| `queued_at`, `updated_at` | timestamptz | |

---

### `executive_briefs`

Daily executive brief snapshots.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `summary` | text | |
| `confidence_score` | integer | |
| `recommended_focus` | text | |
| `priorities`, `decisions`, `risks`, `opportunities`, `ai_prepared` | jsonb | Structured UI payloads |
| `workload_estimate` | text | |
| `is_active` | boolean | One active brief per user |
| `created_at`, `updated_at` | timestamptz | |

---

### `skills`

Global and per-user AI skills.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK nullable | `null` = global skill |
| `name`, `description` | text | |
| `input_description`, `output_description` | text | |
| `enabled` | boolean | |
| `search_tags` | text[] | |

---

### `trusted_sources` (Sprint 8)

Global catalog of monitored sources. Not user-scoped.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | e.g. `ts-icao` |
| `name`, `category`, `description` | text | |
| `search_tags` | text[] | |
| `url` | text | Optional source URL |
| `enabled` | boolean | Soft disable |
| `created_at`, `updated_at` | timestamptz | |

Seeded from static config in migration `20260701000003_sprint8_foundation.sql`.

---

### `brain_activity`

Audit log of executive brain actions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `action`, `target` | text | e.g. "Approved research" |
| `created_at` | timestamptz | |

---

## Views (Sprint 8)

| View | Maps to | Purpose |
|------|---------|---------|
| `profiles` | `users` | Sprint 8 canonical naming |
| `knowledge_items` | `knowledge` | Sprint 8 canonical naming |

Application code currently queries base tables (`users`, `knowledge`). Views exist for external tooling and future alignment.

---

## Row Level Security

All user-scoped tables enforce `auth.uid() = user_id` (or `auth.uid() = id` for `users`).

`trusted_sources` allows read for authenticated users where `enabled = true`.

Global skills (`user_id IS NULL`) are readable by all authenticated users.

---

## New user seeding

Migration `20260701000002_seed_and_auth_trigger.sql` defines:

- `seed_default_user_data(user_id)` — inserts starter knowledge, memory, research queue, brief
- `handle_new_user()` trigger on `auth.users` INSERT — creates profile + seeds data

---

## Repository layer

UI and API routes never query Supabase directly for domain data. They use:

```
app/api/* → lib/repositories/server.ts → Supabase or mock implementation
```

See `lib/repositories/` for interfaces and `lib/repositories/mock/` for fallback implementations.

---

## Migration files

```
supabase/migrations/
├── 20260701000001_core_schema.sql
├── 20260701000002_seed_and_auth_trigger.sql
└── 20260701000003_sprint8_foundation.sql
```

Apply in order. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for instructions.
