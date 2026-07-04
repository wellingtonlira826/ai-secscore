# AI SecScore

AI SecScore is an AI security assessment platform: authenticated users evaluate their AI/LLM systems against security frameworks, answer maturity questionnaires, upload evidence, and get scored reports with gap analysis and history tracking.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ai-secscore/` — React + Vite frontend (pages in `src/pages`, i18n locales in `src/i18n/locales/{en,es,pt-BR}.json`, shared UI in `src/components`).
- `artifacts/api-server/` — Express 5 API. Entry `src/app.ts`; routes registered in `src/routes/index.ts`; auth/session helpers in `src/lib/auth.ts`; object storage in `src/lib/objectStorage.ts`.
- `lib/db/` — Drizzle schema (source of truth for DB): `src/schema/{auth,assessments,evidence}.ts`.
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts). `lib/api-zod/` and `lib/api-client-react/` are generated from it.
- Scoring logic lives in `artifacts/api-server/src/routes/assessments.ts` (`loadScoringContext` + `scoreFromAnswers`).

## Architecture decisions

- Contract-first: the OpenAPI spec drives generated Zod schemas (`@workspace/api-zod`) and React Query hooks (`@workspace/api-client-react`). Do not hand-edit generated files; run codegen instead.
- Auth is Replit OIDC with server-side sessions in Postgres. Sessions are accepted via the `sid` cookie or `Authorization: Bearer <sid>` (mobile + tests). All authorization is row-scoped by `userId` — cross-user access returns 404, not 403.
- Scoring reference data (questions, frameworks, user weights) is loaded once per request via `loadScoringContext`, and `scoreFromAnswers` is a pure function — this keeps the history endpoint free of N+1 queries.
- Security middleware in `app.ts`: `helmet`, CORS restricted to `REPLIT_DOMAINS` origins, 1mb body limit, and a 300-req/15min rate limiter on `/api` (behind `trust proxy 1`).
- Frontend routes are lazy-loaded and wrapped in an `ErrorBoundary` so a render failure shows a localized fallback instead of a blank screen.

## Product

- Create and manage security assessments for AI/LLM systems.
- Answer maturity questionnaires mapped to multiple security frameworks with configurable per-framework weights.
- Upload and view evidence files attached to assessments.
- View scored results with grades, risk posture, framework breakdown, gap/remediation priorities, and an executive summary.
- Compare two assessments and track each system's score history over time (with CSV export).
- Full UI localization in English, Spanish, and Brazilian Portuguese.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
