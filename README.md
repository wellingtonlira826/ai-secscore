# ai-secscore

Plataforma de avaliacao de seguranca para sistemas de IA e LLMs. Avalie o nivel de maturidade de seguranca dos seus sistemas atraves de questionarios mapeados a frameworks reconhecidos (OWASP LLM Top 10, NIST AI RMF, ISO 42001 e outros), faca upload de evidencias, gere relatorios com pontuacao, gaps e plano de remediacao.

## Funcionalidades

- Questionarios de maturidade mapeados a multiplos frameworks de seguranca de IA
- Pesos configurados por framework para pontuacao personalizada
- Upload e gestao de evidencias por questao
- Dashboard com nota geral, postura de risco e breakdown por framework
- Plano de remediacao com prioridades e quick wins
- Comparacao de assessments ao longo do tempo (historico + export CSV)
- Assessments corporativos com dominios, indice de maturidade e benchmarks de setor
- Interface disponivel em Portugues (BR), Ingles e Espanhol

## Stack

- **Monorepo** pnpm workspaces
- **API**: Node.js 24 + Express 5 + TypeScript
- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Banco**: PostgreSQL + Drizzle ORM
- **Validacao**: Zod + drizzle-zod
- **Contratos**: OpenAPI spec com codegen (Orval) para Zod schemas e React Query hooks

## Estrutura

```
artifacts/ai-secscore/   frontend React + Vite
artifacts/api-server/    API Express 5
lib/db/                  schema Drizzle (PostgreSQL)
lib/api-spec/            spec OpenAPI
lib/api-zod/             tipos e schemas gerados
lib/api-client-react/    client React Query gerado
lib/auth-web/            hook de autenticacao
```

## Rodando localmente

**Pre-requisitos**: Node.js 24, pnpm, PostgreSQL (ou Docker).

### 1. Banco de dados via Docker

```bash
docker run -d \
  --name ai-secscore-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_secscore \
  -p 5432:5432 \
  postgres:16
```

### 2. Variaveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_secscore
NODE_ENV=development
AUTH_USERNAME=admin
AUTH_PASSWORD=admin
```

### 3. Instalar dependencias

```bash
pnpm install
```

### 4. Aplicar schema

```bash
# Git Bash / Linux / macOS
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_secscore
pnpm --filter @workspace/db run push

# Windows PowerShell
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/ai_secscore"
pnpm --filter @workspace/db run push
```

### 5. Rodar a API (porta 5000)

```bash
# Git Bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_secscore
export NODE_ENV=development
export PORT=5000
cd artifacts/api-server && pnpm run build && pnpm run start
```

### 6. Rodar o frontend (porta 3000) — outro terminal

```bash
pnpm --filter @workspace/ai-secscore run dev
```

Acesse: **http://localhost:3000**

Login padrao: `admin` / `admin` (altere via `AUTH_USERNAME` e `AUTH_PASSWORD` no `.env`).

## Outros comandos

```bash
pnpm run typecheck   # typecheck em todos os pacotes
pnpm run build       # typecheck + build completo
```

## Parar o banco

```bash
docker stop ai-secscore-db && docker rm ai-secscore-db
```

## Licenca

MIT
