import { describe, it, expect } from "vitest";
import type { CorporateScoreResult, CorpDomainScore } from "../corporateScoring";
import {
  buildCorporateRecommendations,
  domainPriority,
  severityFromScore,
  horizonForDomain,
} from "./engine";
import { RECOMMENDATION_CATALOG } from "./catalog";
import { CORP_DOMAINS } from "../corporateSeedData/domains";

function domainScore(
  partial: Partial<CorpDomainScore> & { domainId: number; slug: string },
): CorpDomainScore {
  return {
    name: `Domain ${partial.domainId}`,
    pillar: "Pilar",
    weight: 1,
    order: partial.domainId,
    score: null,
    maturityLevel: null,
    cappedByEliminatory: false,
    answeredCount: 0,
    totalCount: 5,
    requiredMissingCount: 0,
    ...partial,
  };
}

function scoreResult(domains: CorpDomainScore[]): CorporateScoreResult {
  return {
    assessmentId: 1,
    overallScore: 50,
    maturityLevel: 3,
    answeredCount: 10,
    totalCount: 20,
    completionPct: 50,
    canComplete: true,
    missingRequired: [],
    eliminatoryFailures: [],
    pillars: [],
    domains,
    indices: [],
  };
}

describe("catalog coverage", () => {
  it("has an entry for every seeded domain slug", () => {
    for (const d of CORP_DOMAINS) {
      expect(RECOMMENDATION_CATALOG[d.slug], `missing catalog entry for ${d.slug}`).toBeDefined();
    }
  });
});

describe("helpers", () => {
  it("domainPriority weighs gap by domain weight and eliminatory cap", () => {
    const base = domainScore({ domainId: 1, slug: "llmops", score: 40, weight: 1.5 });
    expect(domainPriority(base)).toBe(90);
    expect(domainPriority({ ...base, cappedByEliminatory: true })).toBe(110);
    expect(domainPriority({ ...base, score: null })).toBe(0);
  });

  it("severityFromScore maps thresholds and eliminatory cap", () => {
    expect(severityFromScore(10, false)).toBe("critical");
    expect(severityFromScore(30, false)).toBe("high");
    expect(severityFromScore(55, false)).toBe("medium");
    expect(severityFromScore(55, true)).toBe("critical");
  });

  it("horizonForDomain buckets by criticality", () => {
    expect(horizonForDomain(domainScore({ domainId: 1, slug: "rag", score: 10 }))).toBe("0-6");
    expect(horizonForDomain(domainScore({ domainId: 1, slug: "rag", score: 30 }))).toBe("6-12");
    expect(horizonForDomain(domainScore({ domainId: 1, slug: "rag", score: 55 }))).toBe("12-24");
    expect(
      horizonForDomain(domainScore({ domainId: 1, slug: "rag", score: 55, cappedByEliminatory: true })),
    ).toBe("0-6");
  });
});

describe("buildCorporateRecommendations", () => {
  const domains = [
    domainScore({ domainId: 1, slug: "seguranca-ia", name: "Segurança de IA", score: 10, maturityLevel: 1, weight: 1.5 }),
    domainScore({ domainId: 2, slug: "llmops", name: "LLMOps", score: 30, maturityLevel: 2, weight: 1.3 }),
    domainScore({ domainId: 3, slug: "rag", name: "RAG", score: 55, maturityLevel: 3, weight: 1.2 }),
    domainScore({ domainId: 4, slug: "governanca-ia", name: "Governança de IA", score: 85, maturityLevel: 5, weight: 1.5 }),
    domainScore({ domainId: 5, slug: "mlops", name: "MLOps", score: null }),
  ];
  const result = buildCorporateRecommendations(scoreResult(domains));

  it("ranks risks worst-first with catalog content", () => {
    expect(result.topRisks[0].domainSlug).toBe("seguranca-ia");
    expect(result.topRisks[0].severity).toBe("critical");
    expect(result.topRisks[0].title).toBe(RECOMMENDATION_CATALOG["seguranca-ia"].risk.title);
    expect(result.topRisks.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    // unscored domains excluded
    expect(result.topRisks.some((r) => r.domainSlug === "mlops")).toBe(false);
  });

  it("limits risks and opportunities to 10", () => {
    const many = Array.from({ length: 15 }, (_, i) =>
      domainScore({
        domainId: i + 1,
        slug: Object.keys(RECOMMENDATION_CATALOG)[i],
        score: 20 + i,
      }),
    );
    const r = buildCorporateRecommendations(scoreResult(many));
    expect(r.topRisks).toHaveLength(10);
    expect(r.topOpportunities).toHaveLength(10);
  });

  it("quick wins only come from gap domains with high-impact/low-effort actions", () => {
    for (const qw of result.quickWins) {
      expect(qw.impact).toBe("high");
      expect(qw.effort).toBe("low");
      const d = domains.find((x) => x.domainId === qw.domainId)!;
      expect(d.score as number).toBeLessThan(60);
    }
    // governanca-ia scores 85 — no gap, no quick win despite qualifying action
    expect(result.quickWins.some((q) => q.domainSlug === "governanca-ia")).toBe(false);
  });

  it("projects carry horizons matching domain criticality", () => {
    const sec = result.priorityProjects.find((p) => p.domainSlug === "seguranca-ia")!;
    expect(sec.horizon).toBe("0-6");
    const llm = result.priorityProjects.find((p) => p.domainSlug === "llmops")!;
    expect(llm.horizon).toBe("6-12");
    const rag = result.priorityProjects.find((p) => p.domainSlug === "rag")!;
    expect(rag.horizon).toBe("12-24");
  });

  it("roadmap contains quick wins in 0-6 plus all projects", () => {
    const qwInitiatives = result.roadmap.filter((r) => r.type === "quick_win");
    expect(qwInitiatives.length).toBe(result.quickWins.length);
    expect(qwInitiatives.every((r) => r.horizon === "0-6")).toBe(true);
    expect(result.roadmap.filter((r) => r.type === "project").length).toBe(
      result.priorityProjects.length,
    );
  });

  it("SWOT places strong domains as strengths and critical risks as threats", () => {
    expect(result.swot.strengths.map((s) => s.domainName)).toContain("Governança de IA");
    expect(result.swot.weaknesses.some((w) => w.domainName === "Segurança de IA")).toBe(true);
    expect(result.swot.threats.every((t) => t.text.length > 0)).toBe(true);
    expect(result.swot.threats.some((t) => t.domainName === "RAG")).toBe(false); // medium severity
  });

  it("backlog is ranked by descending priority score", () => {
    const scores = result.backlog.map((b) => b.priorityScore);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(result.backlog.map((b) => b.rank)).toEqual(result.backlog.map((_, i) => i + 1));
  });

  it("tools listed for every gap domain", () => {
    expect(result.tools.map((t) => t.domainSlug).sort()).toEqual(
      ["llmops", "rag", "seguranca-ia"].sort(),
    );
    expect(result.tools.every((t) => t.tools.length > 0)).toBe(true);
  });

  it("handles a fully unanswered assessment", () => {
    const empty = buildCorporateRecommendations(
      scoreResult([domainScore({ domainId: 1, slug: "rag", score: null })]),
    );
    expect(empty.topRisks).toHaveLength(0);
    expect(empty.backlog).toHaveLength(0);
    expect(empty.swot.strengths).toHaveLength(0);
  });
});
