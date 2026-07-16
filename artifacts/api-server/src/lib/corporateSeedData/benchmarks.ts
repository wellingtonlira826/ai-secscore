// Curated benchmark reference data for the 8 organization profiles.
//
// These are static, editable reference values (0–100 maturity scores per
// domain) grounded in public market research (Gartner AI Maturity Model,
// McKinsey State of AI, IDC AI Readiness, FEBRABAN Tech surveys) — NOT
// aggregated customer data. Edit the pillar bases / adjustments below and
// re-seed to update.
//
// Expansion model: each profile defines a base score per pillar; a global
// per-domain adjustment reflects market-wide realities (e.g. AI Agents are
// nascent everywhere); profile-specific overrides capture notable outliers.

import { CORP_DOMAINS } from "./domains";

export type BenchmarkProfileSeed = {
  slug: string;
  name: string;
  description: string;
  order: number;
  /** Base score (0–100) per pillar name. */
  pillarBases: Record<string, number>;
  /** Optional per-domain overrides (domain slug → absolute score). */
  overrides?: Record<string, number>;
};

// Market-wide domain adjustments applied to every profile (relative deltas).
const DOMAIN_ADJUSTMENTS: Record<string, number> = {
  "ai-agents": -16,
  rag: -10,
  llmops: -12,
  mlops: -5,
  "monitoramento-observabilidade": -7,
  "finops-ia": -9,
  "etica-ia": -5,
  "transparencia-explicabilidade": -7,
  "gestao-vulnerabilidades-ia": -6,
  "gestao-fornecedores": -4,
  "gestao-mudanca": -4,
  "compliance-regulatorio": +5,
  "privacidade-lgpd": +4,
  "seguranca-dados": +3,
  "estrategia-ia": +3,
  "portfolio-casos-uso": +2,
};

export const BENCHMARK_PROFILES: BenchmarkProfileSeed[] = [
  {
    slug: "banco-digital",
    name: "Banco Digital",
    description:
      "Bancos nativos digitais com forte cultura de engenharia, adoção agressiva de IA generativa e esteiras de ML maduras.",
    order: 1,
    pillarBases: {
      "Estratégia & Governança": 71,
      "Dados": 76,
      "Tecnologia & Operações": 74,
      "Segurança & Resiliência": 70,
      "Pessoas & Cultura": 69,
      "Valor & Gestão": 66,
      "Ciclo de Vida de Modelos": 68,
    },
    overrides: { llmops: 70, rag: 68, "ai-agents": 58, "cultura-ia": 74 },
  },
  {
    slug: "banco-tradicional",
    name: "Banco Tradicional",
    description:
      "Grandes bancos incumbentes: governança e compliance fortes, modernização tecnológica gradual e forte gestão de risco de modelos.",
    order: 2,
    pillarBases: {
      "Estratégia & Governança": 68,
      "Dados": 64,
      "Tecnologia & Operações": 56,
      "Segurança & Resiliência": 71,
      "Pessoas & Cultura": 54,
      "Valor & Gestão": 60,
      "Ciclo de Vida de Modelos": 67,
    },
    overrides: { "compliance-regulatorio": 80, "validacao-modelos": 75, "ai-agents": 32, llmops: 42 },
  },
  {
    slug: "fintech",
    name: "Fintech",
    description:
      "Fintechs em crescimento: alta velocidade de experimentação com IA, stack moderna, governança e compliance ainda em formação.",
    order: 3,
    pillarBases: {
      "Estratégia & Governança": 55,
      "Dados": 64,
      "Tecnologia & Operações": 70,
      "Segurança & Resiliência": 57,
      "Pessoas & Cultura": 63,
      "Valor & Gestão": 57,
      "Ciclo de Vida de Modelos": 55,
    },
    overrides: { llmops: 66, rag: 62, "ai-agents": 52, "compliance-regulatorio": 52, "governanca-ia": 48 },
  },
  {
    slug: "seguradora",
    name: "Seguradora",
    description:
      "Seguradoras: uso consolidado de modelos atuariais e analítica, adoção de IA generativa moderada e compliance setorial forte.",
    order: 4,
    pillarBases: {
      "Estratégia & Governança": 61,
      "Dados": 60,
      "Tecnologia & Operações": 53,
      "Segurança & Resiliência": 62,
      "Pessoas & Cultura": 51,
      "Valor & Gestão": 56,
      "Ciclo de Vida de Modelos": 62,
    },
    overrides: { "validacao-modelos": 68, "ai-agents": 28 },
  },
  {
    slug: "cooperativa",
    name: "Cooperativa",
    description:
      "Cooperativas de crédito: adoção de IA em estágio inicial-intermediário, foco em eficiência e dependência de fornecedores.",
    order: 5,
    pillarBases: {
      "Estratégia & Governança": 48,
      "Dados": 45,
      "Tecnologia & Operações": 42,
      "Segurança & Resiliência": 51,
      "Pessoas & Cultura": 45,
      "Valor & Gestão": 43,
      "Ciclo de Vida de Modelos": 44,
    },
    overrides: { "gestao-fornecedores": 50, "ai-agents": 22 },
  },
  {
    slug: "varejo",
    name: "Varejo",
    description:
      "Varejistas: IA aplicada a personalização, previsão de demanda e atendimento; segurança e governança de IA menos maduras.",
    order: 6,
    pillarBases: {
      "Estratégia & Governança": 52,
      "Dados": 58,
      "Tecnologia & Operações": 56,
      "Segurança & Resiliência": 46,
      "Pessoas & Cultura": 50,
      "Valor & Gestão": 55,
      "Ciclo de Vida de Modelos": 46,
    },
    overrides: { "portfolio-casos-uso": 62, rag: 50, "roi-valor": 60 },
  },
  {
    slug: "industrial",
    name: "Industrial",
    description:
      "Indústria: IA voltada a manutenção preditiva, qualidade e otimização; maturidade digital heterogênea entre plantas.",
    order: 7,
    pillarBases: {
      "Estratégia & Governança": 49,
      "Dados": 51,
      "Tecnologia & Operações": 50,
      "Segurança & Resiliência": 50,
      "Pessoas & Cultura": 44,
      "Valor & Gestão": 48,
      "Ciclo de Vida de Modelos": 45,
    },
    overrides: { "infraestrutura-computacional": 55, "ai-agents": 20 },
  },
  {
    slug: "empresa-publica",
    name: "Empresa Pública",
    description:
      "Empresas públicas: forte peso regulatório e de transparência, ciclos de adoção mais longos e restrições orçamentárias.",
    order: 8,
    pillarBases: {
      "Estratégia & Governança": 46,
      "Dados": 42,
      "Tecnologia & Operações": 38,
      "Segurança & Resiliência": 47,
      "Pessoas & Cultura": 40,
      "Valor & Gestão": 36,
      "Ciclo de Vida de Modelos": 39,
    },
    overrides: { "compliance-regulatorio": 58, "transparencia-explicabilidade": 50, "ai-agents": 15 },
  },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Expand a profile into one score per catalog domain (272 rows total). */
export function expandBenchmarkScores(): Array<{
  profileSlug: string;
  domainSlug: string;
  score: number;
}> {
  const rows: Array<{ profileSlug: string; domainSlug: string; score: number }> = [];
  for (const profile of BENCHMARK_PROFILES) {
    for (const domain of CORP_DOMAINS) {
      const base = profile.pillarBases[domain.pillar];
      if (base == null) {
        throw new Error(`Benchmark profile ${profile.slug} missing pillar base for ${domain.pillar}`);
      }
      const override = profile.overrides?.[domain.slug];
      const raw = override ?? base + (DOMAIN_ADJUSTMENTS[domain.slug] ?? 0);
      rows.push({
        profileSlug: profile.slug,
        domainSlug: domain.slug,
        score: round1(clamp(raw, 5, 95)),
      });
    }
  }
  return rows;
}
