# ai-secscore

Plataforma de avaliação de segurança para sistemas de IA/LLM. Usuários respondem questionários de maturidade mapeados a frameworks de segurança, fazem upload de evidências e recebem relatórios com pontuação, análise de gaps e histórico de evolução.

## Funcionalidades

- Criação e gestão de assessments para sistemas de IA/LLM
- Questionários de maturidade mapeados a múltiplos frameworks (com pesos configuráveis por framework)
- Upload e visualização de evidências anexadas aos assessments
- Resultados com nota, postura de risco, breakdown por framework e prioridades de remediação
- Comparação entre assessments e histórico de pontuação ao longo do tempo (export CSV)
- Interface localizada em Português (BR), Inglês e Espanhol

## Stack

- pnpm workspaces · Node.js 24 · TypeScript 5.9
- API: Express 5
- Frontend: React + Vite
- Banco: PostgreSQL + Drizzle ORM
- Validação: Zod + `drizzle-zod`
- Contratos de API: OpenAPI spec com codegen (Orval) para schemas Zod e hooks React Query

## Estrutura do projeto

```
artifacts/ai-secscore/   → frontend React + Vite
artifacts/api-server/    → API Express 5 (src/app.ts, rotas em src/routes/)
lib/db/                  → schema Drizzle (fonte da verdade do banco)
lib/api-spec/            → spec OpenAPI (fonte da verdade dos contratos)
```

## Rodando localmente

Pré-requisitos: **Node.js 24**, **pnpm**, **Docker Desktop**.

### 1. Subir o banco PostgreSQL via Docker

```bash
docker run -d \
  --name ai-secscore-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_secscore \
  -p 5432:5432 \
  postgres:16
```

### 2. Configurar variáveis de ambiente

Copie o exemplo e ajuste se necessário:

```bash
cp .env.example .env
```

Conteúdo do `.env`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_secscore
NODE_ENV=development
```

### 3. Instalar dependências

```bash
pnpm install --ignore-scripts
```

> `--ignore-scripts` ignora o pre-install check de agente do pnpm (desnecessário localmente).

### 4. Aplicar schema no banco

```bash
# Linux/macOS
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_secscore
pnpm --filter @workspace/db run push

# Windows (Git Bash)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_secscore pnpm --filter @workspace/db run push

# Windows (PowerShell)
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/ai_secscore"
pnpm --filter @workspace/db run push
```

### 5. Rodar a API (porta 5000)

```bash
# Git Bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_secscore
export NODE_ENV=development
cd artifacts/api-server && pnpm run build && pnpm run start

# PowerShell
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/ai_secscore"
$env:NODE_ENV="development"
Set-Location artifacts/api-server; pnpm run build; pnpm run start
```

### 6. Rodar o frontend (porta 5173) — em outro terminal

```bash
pnpm --filter @workspace/ai-secscore run dev
```

Acesse: **http://localhost:5173**

### Outros comandos

```bash
pnpm run typecheck   # typecheck em todos os pacotes
pnpm run build       # typecheck + build completo
```

> **Nota sobre autenticação:** o login usa Replit OIDC. Em ambiente local, a API e o banco funcionam para desenvolvimento, mas o fluxo de autenticação completo exige deploy no Replit (ou substituição por outro provedor OIDC).

## Parar e remover o banco

```bash
docker stop ai-secscore-db && docker rm ai-secscore-db
```

## Licença

MIT
