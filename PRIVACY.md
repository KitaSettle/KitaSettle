# KitaSettle Privacy Policy (Draft)

> **Status:** Draft for alpha/beta review. Not legal advice. Consult counsel before public launch.

**Effective date:** July 1, 2026  
**Product:** KitaSettle Alpha  
**Contact:** Project maintainer

## Overview

KitaSettle is an executive intelligence assistant. This draft explains what data we collect, why, and your choices. It is intended to align engineering controls with user-facing transparency.

## Data We Collect

| Category | Examples | Purpose |
|----------|----------|---------|
| Account | Email, name, role, company | Authentication and personalization |
| Executive DNA | Interview answers, preferences, learning events | Tailor recommendations and decisions |
| Knowledge & memory | Saved articles, notes, tags | Executive brain and search |
| Research queue | Summaries, approvals, rejections | Curated intelligence workflow |
| Integrations (optional) | Calendar events, email metadata, document names | Context for briefs and decisions |
| Usage & security | Login events, API actions, audit metadata | Security, abuse prevention, debugging |

We do **not** intentionally log email bodies, full document contents, or API keys in application logs.

## How We Use Data

- Generate executive briefs, decision recommendations, and research summaries
- Sync optional Google Calendar, Gmail metadata, and Drive folder indexes
- Improve personalization through Executive DNA learning (per-user, not sold to third parties)
- Maintain security audit trails

## Third-Party Processors

| Provider | Data shared | Location |
|----------|-------------|----------|
| Supabase | All persisted user data | Configured region |
| Vercel | Request metadata, deployment logs | Global edge |
| OpenAI | Sanitized prompts for AI features | US (API) |
| Google | OAuth tokens, Calendar/Gmail/Drive API data | User's Google account |

OAuth tokens are stored server-side only and are not accessible via the user's browser session.

## Data Retention

| Data type | Retention |
|-----------|-----------|
| Audit logs | 90 days |
| Email metadata | 30 days |
| Email bodies (if enabled) | 7 days |
| Sync job records | 30 days |
| Decision/DNA learning events | 365 days |
| Core account data | Until account deletion |

Automated purge jobs may be added in a future release.

## Your Rights

Depending on jurisdiction, you may request:

- Access to your stored data
- Correction of inaccurate profile data
- Deletion of your account and associated rows
- Export of your data (manual process during alpha)

Contact the maintainer to exercise these rights.

## Security Measures

See [SECURITY.md](./SECURITY.md) for technical details on RLS, encryption in transit, and access controls.

## Children's Privacy

KitaSettle is not intended for users under 18.

## Changes

We may update this draft as features and legal requirements evolve. Material changes will be communicated before beta launch.

## Alpha Disclaimer

This is a pre-release product. Features, retention periods, and subprocessors may change. Do not store highly regulated data (HIPAA, PCI, etc.) in alpha without explicit written agreement.
