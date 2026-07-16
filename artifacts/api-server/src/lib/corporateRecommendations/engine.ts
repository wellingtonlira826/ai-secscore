// Pure rules engine that crosses corporate assessment results with the
// curated recommendation catalog. No DB access, no AI — fully deterministic
// and unit-testable, following the project's pure-scoring pattern.

import type { CorporateScoreResult, CorpDomainScore } from "../corporateScoring";
import { RECOMMENDATION_CATALOG, type Impact, type Effort } from "./catalog";

export type Horizon = "0-6" | "6-12" | "12-24";

export type RecommendedRisk = {
  rank: number;
  domainId: number;
  domainSlug: string;
  domainName: string;
  pillar: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium";
  domainScore: number | null;
  maturityLevel: number | null;
  cappedByEliminatory: boolean;
};

export type RecommendedOpportunity = {
  rank: number;
  domainId: number;
  domainSlug: string;
  domainName: string;
  pillar: string;
  title: string;
  description: string;
  domainScore: number | null;
};

export type QuickWin = {
  domainId: number;
  domainSlug: string;
  domainName: string;
  title: string;
  impact: Impact;
  effort: Effort;
  domainScore: number | null;
};

export type PriorityProject = {
  domainId: number;
  domainSlug: string;
  domainName: string;
  pillar: string;
  title: string;
  description: string;
  impact: Impact;
  effort: Effort;
  horizon: Horizon;
  domainScore: number | null;
};

export type ToolRecommendation = {
  domainId: number;
  domainSlug: string;
  domainName: string;
  pillar: string;
  tools: string[];
  domainScore: number | null;
};

export type TrainingRecommendation = {
  domainId: number;
  domainSlug: string;
  domainName: string;
  title: string;
  audience: string;
  domainScore: number | null;
};

export type RoadmapInitiative = {
  title: string;
  domainId: number;
  domainSlug: string;
  domainName: string;
  pillar: string;
  horizon: Horizon;
  type: "quick_win" | "project";
  impact: Impact;
  effort: Effort;
};

export type SwotResult = {
  strengths: Array<{ domainName: string; text: string }>;
  weaknesses: Array<{ domainName: string; text: string }>;
  opportunities: Array<{ domainName: string; text: string }>;
  threats: Array<{ domainName: string; text: string }>;
};

export type BacklogItem = {
  rank: number;
  title: string;
  type: "quick_win" | "project" | "training";
  domainName: string;
  pillar: string;
  impact: Impact;
  effort: Effort;
  horizon: Horizon;
  priorityScore: number;
  domainScore: number | null;
};

export type CorporateRecommendationsResult = {
  assessmentId: number;
  generatedForScore: number | null;
  topRisks: RecommendedRisk[];
  topOpportunities: RecommendedOpportunity[];
  quickWins: QuickWin[];
  priorityProjects: PriorityProject[];
  tools: ToolRecommendation[];
  trainings: TrainingRecommendation[];
  roadmap: RoadmapInitiative[];
  swot: SwotResult;
  backlog: BacklogItem[];
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Priority of a domain gap: bigger gap × domain weight, plus a penalty when
 * the domain is capped by a failed eliminatory question.
 */
export function domainPriority(d: CorpDomainScore): number {
  if (d.score == null) return 0;
  const gap = 100 - d.score;
  const eliminatoryPenalty = d.cappedByEliminatory ? 20 : 0;
  return round1(gap * d.weight + eliminatoryPenalty);
}

export function severityFromScore(score: number, capped: boolean): "critical" | "high" | "medium" {
  if (capped || score < 20) return "critical";
  if (score < 40) return "high";
  return "medium";
}

/** Horizon assignment: most critical gaps first. */
export function horizonForDomain(d: CorpDomainScore): Horizon {
  if (d.score == null) return "12-24";
  if (d.cappedByEliminatory || d.score < 20) return "0-6";
  if (d.score < 40) return "6-12";
  return "12-24";
}

const GAP_THRESHOLD = 60; // domains scoring below this have a gap
const STRENGTH_LEVEL = 4; // maturity level >= 4 counts as a strength

export function buildCorporateRecommendations(
  score: CorporateScoreResult,
): CorporateRecommendationsResult {
  // Scored domains with a catalog entry, worst-first by weighted priority.
  const scored = score.domains
    .filter((d) => d.score != null && RECOMMENDATION_CATALOG[d.slug] != null)
    .sort((a, b) => domainPriority(b) - domainPriority(a));

  const gapDomains = scored.filter((d) => (d.score as number) < GAP_THRESHOLD);
  const cat = (d: CorpDomainScore) => RECOMMENDATION_CATALOG[d.slug]!;

  // ── Top 10 risks: worst weighted domains ────────────────────────────────
  const topRisks: RecommendedRisk[] = scored.slice(0, 10).map((d, i) => ({
    rank: i + 1,
    domainId: d.domainId,
    domainSlug: d.slug,
    domainName: d.name,
    pillar: d.pillar,
    title: cat(d).risk.title,
    description: cat(d).risk.description,
    severity: severityFromScore(d.score as number, d.cappedByEliminatory),
    domainScore: d.score,
    maturityLevel: d.maturityLevel,
    cappedByEliminatory: d.cappedByEliminatory,
  }));

  // ── Top 10 opportunities ────────────────────────────────────────────────
  const topOpportunities: RecommendedOpportunity[] = scored.slice(0, 10).map((d, i) => ({
    rank: i + 1,
    domainId: d.domainId,
    domainSlug: d.slug,
    domainName: d.name,
    pillar: d.pillar,
    title: cat(d).opportunity.title,
    description: cat(d).opportunity.description,
    domainScore: d.score,
  }));

  // ── Quick wins: gap domains whose curated quick win is high impact + low effort ──
  const quickWins: QuickWin[] = gapDomains
    .filter((d) => cat(d).quickWin.impact === "high" && cat(d).quickWin.effort === "low")
    .slice(0, 10)
    .map((d) => ({
      domainId: d.domainId,
      domainSlug: d.slug,
      domainName: d.name,
      title: cat(d).quickWin.title,
      impact: cat(d).quickWin.impact,
      effort: cat(d).quickWin.effort,
      domainScore: d.score,
    }));

  // ── Priority projects: worst gap domains ────────────────────────────────
  const priorityProjects: PriorityProject[] = gapDomains.slice(0, 8).map((d) => ({
    domainId: d.domainId,
    domainSlug: d.slug,
    domainName: d.name,
    pillar: d.pillar,
    title: cat(d).project.title,
    description: cat(d).project.description,
    impact: cat(d).project.impact,
    effort: cat(d).project.effort,
    horizon: horizonForDomain(d),
    domainScore: d.score,
  }));

  // ── Tools per gap domain ────────────────────────────────────────────────
  const tools: ToolRecommendation[] = gapDomains.map((d) => ({
    domainId: d.domainId,
    domainSlug: d.slug,
    domainName: d.name,
    pillar: d.pillar,
    tools: cat(d).tools,
    domainScore: d.score,
  }));

  // ── Trainings for gap domains ───────────────────────────────────────────
  const trainings: TrainingRecommendation[] = gapDomains.slice(0, 8).map((d) => ({
    domainId: d.domainId,
    domainSlug: d.slug,
    domainName: d.name,
    title: cat(d).training.title,
    audience: cat(d).training.audience,
    domainScore: d.score,
  }));

  // ── 24-month roadmap: quick wins land in 0–6, projects by criticality ──
  const roadmap: RoadmapInitiative[] = [
    ...quickWins.map((qw): RoadmapInitiative => {
      const d = scored.find((x) => x.domainId === qw.domainId)!;
      return {
        title: qw.title,
        domainId: qw.domainId,
        domainSlug: qw.domainSlug,
        domainName: qw.domainName,
        pillar: d.pillar,
        horizon: "0-6",
        type: "quick_win",
        impact: qw.impact,
        effort: qw.effort,
      };
    }),
    ...priorityProjects.map((p): RoadmapInitiative => ({
      title: p.title,
      domainId: p.domainId,
      domainSlug: p.domainSlug,
      domainName: p.domainName,
      pillar: p.pillar,
      horizon: p.horizon,
      type: "project",
      impact: p.impact,
      effort: p.effort,
    })),
  ];

  // ── SWOT ────────────────────────────────────────────────────────────────
  const strengths = score.domains
    .filter((d) => d.maturityLevel != null && d.maturityLevel >= STRENGTH_LEVEL && !d.cappedByEliminatory)
    .slice(0, 8)
    .map((d) => ({ domainName: d.name, text: d.name }));

  const weaknesses = scored
    .filter((d) => (d.score as number) < 40 || d.cappedByEliminatory)
    .slice(0, 8)
    .map((d) => ({ domainName: d.name, text: cat(d).risk.title }));

  const swotOpportunities = topOpportunities.slice(0, 6).map((o) => ({
    domainName: o.domainName,
    text: o.title,
  }));

  const threats = topRisks
    .filter((r) => r.severity !== "medium")
    .slice(0, 6)
    .map((r) => ({ domainName: r.domainName, text: r.title }));

  const swot: SwotResult = { strengths, weaknesses, opportunities: swotOpportunities, threats };

  // ── Prioritized backlog: quick wins + projects + trainings ──────────────
  const impactWeight: Record<Impact, number> = { high: 3, medium: 2, low: 1 };
  const effortWeight: Record<Effort, number> = { low: 3, medium: 2, high: 1 };

  const backlogUnranked: Omit<BacklogItem, "rank">[] = [
    ...quickWins.map((qw) => {
      const d = scored.find((x) => x.domainId === qw.domainId)!;
      return {
        title: qw.title,
        type: "quick_win" as const,
        domainName: qw.domainName,
        pillar: d.pillar,
        impact: qw.impact,
        effort: qw.effort,
        horizon: "0-6" as Horizon,
        priorityScore: round1(domainPriority(d) * impactWeight[qw.impact] * effortWeight[qw.effort]),
        domainScore: qw.domainScore,
      };
    }),
    ...priorityProjects.map((p) => {
      const d = scored.find((x) => x.domainId === p.domainId)!;
      return {
        title: p.title,
        type: "project" as const,
        domainName: p.domainName,
        pillar: p.pillar,
        impact: p.impact,
        effort: p.effort,
        horizon: p.horizon,
        priorityScore: round1(domainPriority(d) * impactWeight[p.impact] * effortWeight[p.effort]),
        domainScore: p.domainScore,
      };
    }),
    ...trainings.map((tr) => {
      const d = scored.find((x) => x.domainId === tr.domainId)!;
      return {
        title: tr.title,
        type: "training" as const,
        domainName: tr.domainName,
        pillar: d.pillar,
        impact: "medium" as Impact,
        effort: "low" as Effort,
        horizon: horizonForDomain(d),
        priorityScore: round1(domainPriority(d) * impactWeight.medium * effortWeight.low),
        domainScore: tr.domainScore,
      };
    }),
  ];

  const backlog: BacklogItem[] = backlogUnranked
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  return {
    assessmentId: score.assessmentId,
    generatedForScore: score.overallScore,
    topRisks,
    topOpportunities,
    quickWins,
    priorityProjects,
    tools,
    trainings,
    roadmap,
    swot,
    backlog,
  };
}
