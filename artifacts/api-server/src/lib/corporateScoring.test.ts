import { describe, it, expect } from "vitest";
import {
  normalizeCorpAnswer,
  maturityLevelFromScore,
  eliminatoryFailed,
  scoreCorporateAssessment,
  ELIMINATORY_MATURITY_CAP,
  type CorpScoringQuestion,
  type CorpScoringDomain,
  type CorpScoringAnswer,
} from "./corporateScoring";

const emptyAnswer: Omit<CorpScoringAnswer, "questionId"> = {
  boolValue: null,
  scaleValue: null,
  choiceValue: null,
  textValue: null,
  percentValue: null,
};

function q(partial: Partial<CorpScoringQuestion> & { id: number }): CorpScoringQuestion {
  return {
    domainId: 1,
    text: `Question ${partial.id}`,
    weight: 3,
    answerType: "yes_no",
    options: null,
    required: false,
    eliminatory: false,
    ...partial,
  };
}

function ans(questionId: number, partial: Partial<CorpScoringAnswer>): CorpScoringAnswer {
  return { questionId, ...emptyAnswer, ...partial };
}

const domain = (partial: Partial<CorpScoringDomain> & { id: number }): CorpScoringDomain => ({
  slug: `domain-${partial.id}`,
  name: `Domain ${partial.id}`,
  pillar: "Pilar A",
  weight: 1,
  order: partial.id,
  ...partial,
});

describe("normalizeCorpAnswer", () => {
  it("normalizes yes/no to 100/0", () => {
    const question = q({ id: 1, answerType: "yes_no" });
    expect(normalizeCorpAnswer(question, ans(1, { boolValue: true }))).toBe(100);
    expect(normalizeCorpAnswer(question, ans(1, { boolValue: false }))).toBe(0);
    expect(normalizeCorpAnswer(question, ans(1, {}))).toBeNull();
    expect(normalizeCorpAnswer(question, undefined)).toBeNull();
  });

  it("normalizes scale 1–5 linearly to 0–100", () => {
    const question = q({ id: 1, answerType: "scale_1_5" });
    expect(normalizeCorpAnswer(question, ans(1, { scaleValue: 1 }))).toBe(0);
    expect(normalizeCorpAnswer(question, ans(1, { scaleValue: 3 }))).toBe(50);
    expect(normalizeCorpAnswer(question, ans(1, { scaleValue: 5 }))).toBe(100);
  });

  it("normalizes multiple choice by option position", () => {
    const question = q({
      id: 1,
      answerType: "multiple_choice",
      options: ["Nenhum", "Parcial", "Amplo", "Total"],
    });
    expect(normalizeCorpAnswer(question, ans(1, { choiceValue: "Nenhum" }))).toBe(0);
    expect(normalizeCorpAnswer(question, ans(1, { choiceValue: "Parcial" }))).toBeCloseTo(33.33, 1);
    expect(normalizeCorpAnswer(question, ans(1, { choiceValue: "Total" }))).toBe(100);
    // Unknown option is treated as unanswered, not as 0.
    expect(normalizeCorpAnswer(question, ans(1, { choiceValue: "Outro" }))).toBeNull();
  });

  it("uses percent values directly, clamped to 0–100", () => {
    const question = q({ id: 1, answerType: "percent" });
    expect(normalizeCorpAnswer(question, ans(1, { percentValue: 42 }))).toBe(42);
    expect(normalizeCorpAnswer(question, ans(1, { percentValue: 120 }))).toBe(100);
    expect(normalizeCorpAnswer(question, ans(1, { percentValue: -5 }))).toBe(0);
  });

  it("excludes text answers from scoring", () => {
    const question = q({ id: 1, answerType: "text" });
    expect(normalizeCorpAnswer(question, ans(1, { textValue: "Temos um comitê." }))).toBeNull();
  });
});

describe("maturityLevelFromScore", () => {
  it("maps the five 20-point bands", () => {
    expect(maturityLevelFromScore(0)).toBe(1);
    expect(maturityLevelFromScore(19.9)).toBe(1);
    expect(maturityLevelFromScore(20)).toBe(2);
    expect(maturityLevelFromScore(45)).toBe(3);
    expect(maturityLevelFromScore(60)).toBe(4);
    expect(maturityLevelFromScore(80)).toBe(5);
    expect(maturityLevelFromScore(100)).toBe(5);
  });
});

describe("eliminatoryFailed", () => {
  it("fails on a 'no' answer to an eliminatory yes/no question", () => {
    const question = q({ id: 1, eliminatory: true });
    expect(eliminatoryFailed(question, ans(1, { boolValue: false }))).toBe(true);
    expect(eliminatoryFailed(question, ans(1, { boolValue: true }))).toBe(false);
    expect(eliminatoryFailed(question, undefined)).toBe(false); // unanswered ≠ failed
  });

  it("fails on low scale answers only", () => {
    const question = q({ id: 1, eliminatory: true, answerType: "scale_1_5" });
    expect(eliminatoryFailed(question, ans(1, { scaleValue: 2 }))).toBe(true); // 25 < 50
    expect(eliminatoryFailed(question, ans(1, { scaleValue: 3 }))).toBe(false); // 50
  });

  it("never fails non-eliminatory questions", () => {
    const question = q({ id: 1, eliminatory: false });
    expect(eliminatoryFailed(question, ans(1, { boolValue: false }))).toBe(false);
  });
});

describe("scoreCorporateAssessment", () => {
  it("weights questions inside a domain", () => {
    const domains = [domain({ id: 1 })];
    const questions = [
      q({ id: 1, weight: 5, answerType: "yes_no" }),
      q({ id: 2, weight: 1, answerType: "yes_no" }),
    ];
    const answers = [ans(1, { boolValue: true }), ans(2, { boolValue: false })];
    const result = scoreCorporateAssessment(10, domains, questions, answers);
    // (100*5 + 0*1) / 6 = 83.3
    expect(result.domains[0].score).toBeCloseTo(83.3, 1);
    expect(result.domains[0].maturityLevel).toBe(5);
    expect(result.overallScore).toBeCloseTo(83.3, 1);
  });

  it("weights domains in the overall score", () => {
    const domains = [domain({ id: 1, weight: 3 }), domain({ id: 2, weight: 1 })];
    const questions = [q({ id: 1, domainId: 1 }), q({ id: 2, domainId: 2 })];
    const answers = [ans(1, { boolValue: true }), ans(2, { boolValue: false })];
    const result = scoreCorporateAssessment(10, domains, questions, answers);
    // (100*3 + 0*1) / 4 = 75
    expect(result.overallScore).toBe(75);
    expect(result.maturityLevel).toBe(4);
  });

  it("caps domain maturity when an eliminatory question fails", () => {
    const domains = [domain({ id: 1 })];
    const questions = [
      q({ id: 1, weight: 1, eliminatory: true }),
      q({ id: 2, weight: 5, answerType: "scale_1_5" }),
    ];
    const answers = [ans(1, { boolValue: false }), ans(2, { scaleValue: 5 })];
    const result = scoreCorporateAssessment(10, domains, questions, answers);
    // Score stays high (83.3) but the maturity level is capped.
    expect(result.domains[0].score).toBeCloseTo(83.3, 1);
    expect(result.domains[0].maturityLevel).toBe(ELIMINATORY_MATURITY_CAP);
    expect(result.domains[0].cappedByEliminatory).toBe(true);
    expect(result.eliminatoryFailures).toHaveLength(1);
    expect(result.eliminatoryFailures[0].questionId).toBe(1);
  });

  it("blocks completion while required questions are unanswered", () => {
    const domains = [domain({ id: 1 })];
    const questions = [
      q({ id: 1, required: true }),
      q({ id: 2, required: true }),
      q({ id: 3, required: false }),
    ];
    const answers = [ans(1, { boolValue: true })];
    const result = scoreCorporateAssessment(10, domains, questions, answers);
    expect(result.canComplete).toBe(false);
    expect(result.missingRequired).toHaveLength(1);
    expect(result.missingRequired[0].questionId).toBe(2);

    const complete = scoreCorporateAssessment(10, domains, questions, [
      ...answers,
      ans(2, { boolValue: false }),
    ]);
    expect(complete.canComplete).toBe(true);
    expect(complete.missingRequired).toHaveLength(0);
  });

  it("returns null scores for fully unanswered assessments", () => {
    const domains = [domain({ id: 1 })];
    const questions = [q({ id: 1 })];
    const result = scoreCorporateAssessment(10, domains, questions, []);
    expect(result.overallScore).toBeNull();
    expect(result.maturityLevel).toBeNull();
    expect(result.domains[0].score).toBeNull();
    expect(result.pillars[0].score).toBeNull();
    expect(result.completionPct).toBe(0);
  });

  it("counts answered text questions for completion but not for the score", () => {
    const domains = [domain({ id: 1 })];
    const questions = [q({ id: 1, answerType: "text", required: true }), q({ id: 2 })];
    const answers = [ans(1, { textValue: "Processo documentado." }), ans(2, { boolValue: true })];
    const result = scoreCorporateAssessment(10, domains, questions, answers);
    expect(result.answeredCount).toBe(2);
    expect(result.canComplete).toBe(true);
    expect(result.domains[0].score).toBe(100); // only the yes/no counts toward the score
  });

  it("computes pillar scores and derived indices", () => {
    const domains = [
      domain({ id: 1, slug: "seguranca-ia", pillar: "Segurança & Resiliência", weight: 1.5 }),
      domain({ id: 2, slug: "ai-agents", pillar: "Tecnologia & Operações", weight: 1.2 }),
      domain({ id: 3, slug: "cultura-ia", pillar: "Pessoas & Cultura", weight: 1.1 }),
    ];
    const questions = [
      q({ id: 1, domainId: 1, answerType: "scale_1_5" }),
      q({ id: 2, domainId: 2, answerType: "scale_1_5" }),
      q({ id: 3, domainId: 3, answerType: "scale_1_5" }),
    ];
    const answers = [
      ans(1, { scaleValue: 5 }), // 100
      ans(2, { scaleValue: 3 }), // 50
      ans(3, { scaleValue: 1 }), // 0
    ];
    const result = scoreCorporateAssessment(10, domains, questions, answers);

    const secPillar = result.pillars.find((p) => p.pillar === "Segurança & Resiliência");
    expect(secPillar?.score).toBe(100);

    const maturity = result.indices.find((i) => i.key === "maturity");
    // (100*1.5 + 50*1.2 + 0*1.1) / 3.8 = 55.3
    expect(maturity?.score).toBeCloseTo(55.3, 1);
    expect(maturity?.maturityLevel).toBe(3);

    // Risk index only sees seguranca-ia (100) → risk = 0.
    const risk = result.indices.find((i) => i.key === "risk");
    expect(risk?.score).toBe(0);
    expect(risk?.maturityLevel).toBeNull();

    // Agent readiness sees seguranca-ia (100, w1.5) and ai-agents (50, w1.2) → 77.8.
    const agents = result.indices.find((i) => i.key === "agent_readiness");
    expect(agents?.score).toBeCloseTo(77.8, 1);

    // GenAI readiness sees only seguranca-ia here.
    const genai = result.indices.find((i) => i.key === "genai_readiness");
    expect(genai?.score).toBe(100);
  });
});
