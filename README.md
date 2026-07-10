# AI SecScore

AI SecScore is an AI security assessment platform: users evaluate their AI/LLM systems against security frameworks, answer maturity questionnaires, upload evidence, and get scored reports with gap analysis and history tracking.

🔗 **Live app:** [https://secure-asset-analyzer--WellingtonLira.replit.app](https://secure-asset-analyzer--WellingtonLira.replit.app)

## Features

- Create and manage security assessments for AI/LLM systems
- Maturity questionnaires mapped to multiple security frameworks with configurable per-framework weights
- Upload and view evidence files attached to assessments
- Scored results with grades, risk posture, framework breakdown, and gap/remediation priorities
- Compare assessments and track score history over time (with CSV export)
- Full UI localization in English, Spanish, and Brazilian Portuguese

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Frontend: React + Vite
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod, `drizzle-zod`
- API contracts: OpenAPI spec with codegen (Orval) for Zod schemas and React Query hooks

## Project structure

- `artifacts/ai-secscore/` — React + Vite frontend
- `artifacts/api-server/` — Express 5 API (entry `src/app.ts`, routes in `src/routes/`)
- `lib/db/` — Drizzle schema (source of truth for the DB)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)

## Running locally

This project uses **pnpm workspaces** and needs a PostgreSQL database.

```bash
# 1. Install dependencies
pnpm install

# 2. Set the required environment variable
export DATABASE_URL="postgres://user:password@localhost:5432/ai_secscore"

# 3. Push the DB schema
pnpm --filter @workspace/db run push

# 4. Run the API server (port 5000)
pnpm --filter @workspace/api-server run dev
```

Other useful commands:

```bash
pnpm run typecheck   # typecheck across all packages
pnpm run build       # typecheck + build all packages
```

> **Note:** authentication is built on Replit OIDC with server-side sessions, so the login flow is tied to the Replit environment. Running the API/DB locally works for development, but full end-to-end auth currently requires deploying on Replit (or swapping in your own OIDC provider).

## License

MIT
