# Threat Model

## Project Overview

AI SecScore is a publicly deployed assessment application built as a pnpm monorepo with a React frontend, an Express API, PostgreSQL via Drizzle, and Replit object storage. Authenticated users create AI security assessments, answer questionnaire items, and upload evidence files that are later viewed through API-backed storage routes.

## Assets

- **User accounts and sessions** — Replit OIDC identities, server-side session IDs, and refresh/access tokens stored in the session record. Compromise allows impersonation and access to a user’s assessments and evidence.
- **Assessment data** — assessment names, system descriptions, answers, scores, summaries, and framework-weight preferences. Cross-user tampering or disclosure would corrupt reports and expose business-sensitive posture data.
- **Evidence files** — uploaded documents and metadata linked to assessments. These may contain sensitive internal security documentation, screenshots, or policy records.
- **Application secrets and infrastructure access** — database connectivity and Replit object-storage sidecar access. Abuse can lead to storage misuse, data loss, or broader backend compromise.

## Trust Boundaries

- **Browser/mobile client to API** — all `/api/*` traffic originates from untrusted clients and must be authenticated, authorized, and validated server-side.
- **API to PostgreSQL** — the API is trusted to enforce tenant boundaries before reading or mutating shared tables containing assessment, evidence, and session data.
- **API to object storage** — the API can mint upload URLs and stream objects from the private storage area; this boundary must enforce ownership and visibility rules.
- **Public to authenticated surfaces** — framework/question catalog routes are public, while assessment, dashboard, evidence, and private storage flows must enforce authenticated user ownership.
- **Production to dev-only surfaces** — `artifacts/mockup-sandbox/**` is dev-only and should be ignored unless separate production reachability is demonstrated.

## Scan Anchors

- Backend entry: `artifacts/api-server/src/app.ts` with all route registration in `artifacts/api-server/src/routes/index.ts`.
- Highest-risk production areas: `routes/storage.ts`, `routes/evidence.ts`, `routes/assessments.ts`, `routes/auth.ts`, and `lib/objectStorage.ts`.
- Public surfaces: framework/question catalog routes, login/callback/logout endpoints, and any storage route lacking explicit auth checks.
- Authenticated user data surfaces: assessments, answers, dashboard, evidence, framework weights, and mobile bearer-token API access.
- Dev-only: `artifacts/mockup-sandbox/**`, tooling under `scripts/**`.

## Threat Categories

### Spoofing

The application depends on Replit OIDC and server-side session lookups to establish identity. All protected endpoints must require a valid session token or cookie, mobile bearer tokens must be treated as full session credentials, and auth flows must reject attacker-controlled redirects or token exchanges that are not bound to the initiating user.

### Tampering

Authenticated users can create assessments, upload evidence, and update answers. The API must verify ownership before every mutation, including delete flows, and must not allow one user to alter another user’s records by guessing integer IDs or supplying arbitrary object paths.

### Information Disclosure

Assessment responses and evidence files can contain sensitive internal security data. Private object download routes, evidence listings, and assessment retrieval endpoints must scope reads to the owning user and must not expose data merely because an attacker knows or can guess a storage path or numeric identifier.

### Denial of Service

Public endpoints that mint upload URLs or trigger storage/database work can be abused for cost and resource exhaustion. The application must avoid unauthenticated high-cost operations and should ensure public routes cannot be used to fill private storage or amplify backend work without user accountability.

### Elevation of Privilege

A normal user must never gain the ability to read or modify another user’s assessments, answers, or evidence. Server-side authorization is required at every object and row boundary, especially where the code crosses from assessment ownership into shared tables or private object-storage paths.
