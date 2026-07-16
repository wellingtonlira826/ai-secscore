// Pure corporate-assessment scoring engine.
//
// Follows the project scoring pattern: reference data (domains + questions) is
// loaded once per request by the caller, and every function here is pure —
// no DB access, no side effects — so history/benchmark endpoints stay free of
// N+1 queries and the algorithm is unit-testable in isolation.

export type CorpScoringQuestion = {
  id: number;
  domainId: number;
  text: string;
  weight: number; // 1–5
  answerType: "yes_no" | "scale_1_5" | "multiple_choice" | "text" | "percent";
  options: string[] | null;
  required: boolean;
  eliminatory: boolean;
};

export type CorpScoringDomain = {
  id: number;
  slug: string;
  name: string;
  pillar: string;
  weight: number;
  order: number;
};

export type CorpScoringAnswer = {
  questionId: number;
  boolValue: boolean | null;
  scaleValue: number | null;
  choiceValue: string | null;
  textValue: string | null;
  percentValue: number | null;
};

// ── Derived indices: domain-slug mapping (reference data) ────────────────────
export const CORP_INDEX_KEYS = ["maturity", "risk", "genai_readiness", "agent_readiness"] as const;
export type CorpIndexKey = (typeof CORP_INDEX_KEYS)[number];

// "maturity" uses every domain (empty list = all).
export const CORP_INDEX_DOMAINS: Record<CorpIndexKey, string[]> = {
  maturity: [],
  risk: [
    "gestao-riscos-ia",
    "compliance-regulatorio",
    "privacidade-lgpd",
    "seguranca-dados",
    "seguranca-ia",
    "seguranca-aplicacoes-ia",
    "gestao-vulnerabilidades-ia",
    "resposta-incidentes-ia",
    "validacao-modelos",
  ],
  genai_readiness: [
    "llmops",
    "rag",
    "governanca-dados",
    "qualidade-dados",
    "arquitetura-dados",
    "infraestrutura-computacional",
    "seguranca-ia",
    "etica-ia",
    "talentos-capacitacao",
  ],
  agent_readiness: [
    "ai-agents",
    "rag",
    "llmops",
    "monitoramento-observabilidade",
    "seguranca-ia",
    "seguranca-aplicacoes-ia",
    "arquitetura-integracao",
    "resposta-incidentes-ia",
    "governanca-ia",
  ],
};

// ── Normalization ─────────────────────────────────────────────────────────────

function isBlank(value: string | null): boolean {
  return value == null || value.trim() === "";
}

/** True when the answer row actually carries a value for the question's type. */
export function isAnswered(q: CorpScoringQuestion, a: CorpScoringAnswer | undefined): boolean {
  if (!a) return false;
  switch (q.answerType) {
    case "yes_no":
      return a.boolValue != null;
    case "scale_1_5":
      return a.scaleValue != null;
    case "multiple_choice":
      return !isBlank(a.choiceValue);
    case "text":
      return !isBlank(a.textValue);
    case "percent":
      return a.percentValue != null;
  }
}

/**
 * Normalize an answer to 0–100 for scoring.
 * Returns null when the question is unanswered or not scorable (text).
 */
export function normalizeCorpAnswer(
  q: CorpScoringQuestion,
  a: CorpScoringAnswer | undefined,
): number | null {
  if (!a || !isAnswered(q, a)) return null;
  switch (q.answerType) {
    case "yes_no":
      return a.boolValue ? 100 : 0;
    case "scale_1_5": {
      const v = Math.min(5, Math.max(1, a.scaleValue as number));
      return ((v - 1) / 4) * 100;
    }
    case "multiple_choice": {
      const options = q.options ?? [];
      if (options.length < 2) return null;
      const idx = options.indexOf(a.choiceValue as string);
      if (idx < 0) return null;
      return (idx / (options.length - 1)) * 100;
    }
    case "percent":
      return Math.min(100, Math.max(0, a.percentValue as number));
    case "text":
      return null; // qualitative — excluded from scoring
  }
}

// ── Maturity levels ───────────────────────────────────────────────────────────

/** Map a 0–100 score onto the 5-level maturity model. */
export function maturityLevelFromScore(score: number): number {
  if (score < 20) return 1;
  if (score < 40) return 2;
  if (score < 60) return 3;
  if (score < 80) return 4;
  return 5;
}

/** Maturity level ceiling for a domain with a failed eliminatory question. */
export const ELIMINATORY_MATURITY_CAP = 2;

/** An eliminatory question "fails" when answered with a normalized score below 50. */
export function eliminatoryFailed(q: CorpScoringQuestion, a: CorpScoringAnswer | undefined): boolean {
  if (!q.eliminatory) return false;
  const norm = normalizeCorpAnswer(q, a);
  return norm != null && norm < 50;
}

// ── Result shapes ─────────────────────────────────────────────────────────────

export type CorpDomainScore = {
  domainId: number;
  slug: string;
  name: string;
  pillar: string;
  weight: number;
  order: number;
  score: number | null;
  maturityLevel: number | null;
  cappedByEliminatory: boolean;
  answeredCount: number;
  totalCount: number;
  requiredMissingCount: number;
};

export type CorpPillarScore = {
  pillar: string;
  score: number | null;
  maturityLevel: number | null;
  domainCount: number;
};

export type CorpQuestionFlag = {
  questionId: number;
  domainId: number;
  domainName: string;
  text: string;
};

export type CorpIndexScore = {
  key: CorpIndexKey;
  score: number | null;
  maturityLevel: number | null;
  domainSlugs: string[];
};

export type CorporateScoreResult = {
  assessmentId: number;
  overallScore: number | null;
  maturityLevel: number | null;
  answeredCount: number;
  totalCount: number;
  completionPct: number;
  canComplete: boolean;
  missingRequired: CorpQuestionFlag[];
  eliminatoryFailures: CorpQuestionFlag[];
  pillars: CorpPillarScore[];
  domains: CorpDomainScore[];
  indices: CorpIndexScore[];
};

const round1 = (n: number) => Math.round(n * 10) / 10;

// ── Core scoring ──────────────────────────────────────────────────────────────

export function scoreCorporateAssessment(
  assessmentId: number,
  domains: CorpScoringDomain[],
  questions: CorpScoringQuestion[],
  answers: CorpScoringAnswer[],
): CorporateScoreResult {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  const questionsByDomain = new Map<number, CorpScoringQuestion[]>();
  for (const q of questions) {
    const list = questionsByDomain.get(q.domainId);
    if (list) list.push(q);
    else questionsByDomain.set(q.domainId, [q]);
  }

  const missingRequired: CorpQuestionFlag[] = [];
  const eliminatoryFailures: CorpQuestionFlag[] = [];
  let answeredCount = 0;

  const domainScores: CorpDomainScore[] = [...domains]
    .sort((a, b) => a.order - b.order)
    .map((d) => {
      const dqs = questionsByDomain.get(d.id) ?? [];
      let weightedSum = 0;
      let totalWeight = 0;
      let answered = 0;
      let requiredMissing = 0;
      let hasEliminatoryFailure = false;

      for (const q of dqs) {
        const a = answerMap.get(q.id);
        if (isAnswered(q, a)) {
          answered++;
        } else if (q.required) {
          requiredMissing++;
          missingRequired.push({
            questionId: q.id,
            domainId: d.id,
            domainName: d.name,
            text: q.text,
          });
        }

        if (eliminatoryFailed(q, a)) {
          hasEliminatoryFailure = true;
          eliminatoryFailures.push({
            questionId: q.id,
            domainId: d.id,
            domainName: d.name,
            text: q.text,
          });
        }

        const norm = normalizeCorpAnswer(q, a);
        if (norm != null) {
          weightedSum += norm * q.weight;
          totalWeight += q.weight;
        }
      }

      answeredCount += answered;

      const rawScore = totalWeight > 0 ? weightedSum / totalWeight : null;
      let maturityLevel = rawScore != null ? maturityLevelFromScore(rawScore) : null;
      let capped = false;
      if (maturityLevel != null && hasEliminatoryFailure && maturityLevel > ELIMINATORY_MATURITY_CAP) {
        maturityLevel = ELIMINATORY_MATURITY_CAP;
        capped = true;
      }

      return {
        domainId: d.id,
        slug: d.slug,
        name: d.name,
        pillar: d.pillar,
        weight: d.weight,
        order: d.order,
        score: rawScore != null ? round1(rawScore) : null,
        maturityLevel,
        cappedByEliminatory: capped,
        answeredCount: answered,
        totalCount: dqs.length,
        requiredMissingCount: requiredMissing,
      };
    });

  const weightedAvg = (items: CorpDomainScore[]): number | null => {
    let sum = 0;
    let weight = 0;
    for (const d of items) {
      if (d.score == null) continue;
      sum += d.score * d.weight;
      weight += d.weight;
    }
    return weight > 0 ? sum / weight : null;
  };

  // Pillars preserve the domain catalog order.
  const pillarNames: string[] = [];
  for (const d of domainScores) {
    if (!pillarNames.includes(d.pillar)) pillarNames.push(d.pillar);
  }
  const pillars: CorpPillarScore[] = pillarNames.map((pillar) => {
    const items = domainScores.filter((d) => d.pillar === pillar);
    const score = weightedAvg(items);
    return {
      pillar,
      score: score != null ? round1(score) : null,
      maturityLevel: score != null ? maturityLevelFromScore(score) : null,
      domainCount: items.length,
    };
  });

  const overall = weightedAvg(domainScores);
  const overallScore = overall != null ? round1(overall) : null;

  const bySlug = new Map(domainScores.map((d) => [d.slug, d]));
  const indices: CorpIndexScore[] = CORP_INDEX_KEYS.map((key) => {
    const slugs = CORP_INDEX_DOMAINS[key];
    const items =
      slugs.length === 0
        ? domainScores
        : slugs.map((s) => bySlug.get(s)).filter((d): d is CorpDomainScore => d != null);
    const avg = weightedAvg(items);
    if (avg == null) {
      return { key, score: null, maturityLevel: null, domainSlugs: slugs };
    }
    // Risk is inverted: low maturity in risk-related domains ⇒ high risk.
    const score = key === "risk" ? round1(100 - avg) : round1(avg);
    const maturityLevel = key === "risk" ? null : maturityLevelFromScore(avg);
    return { key, score, maturityLevel, domainSlugs: slugs };
  });

  const totalCount = questions.length;

  return {
    assessmentId,
    overallScore,
    maturityLevel: overallScore != null ? maturityLevelFromScore(overallScore) : null,
    answeredCount,
    totalCount,
    completionPct: totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0,
    canComplete: missingRequired.length === 0,
    missingRequired,
    eliminatoryFailures,
    pillars,
    domains: domainScores,
    indices,
  };
}
