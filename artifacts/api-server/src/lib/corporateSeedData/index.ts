import type { CorpQuestionSeed } from "./types";
import { QUESTIONS_P1 } from "./questions-p1";
import { QUESTIONS_P2 } from "./questions-p2";
import { QUESTIONS_P3 } from "./questions-p3";
import { QUESTIONS_P4 } from "./questions-p4";

export { CORP_DOMAINS, CORP_PILLARS, MATURITY_LEVELS } from "./domains";
export type { CorpDomainSeed, CorpQuestionSeed, CorpAnswerType, CorpCriticality } from "./types";

export const CORP_QUESTIONS: CorpQuestionSeed[] = [
  ...QUESTIONS_P1,
  ...QUESTIONS_P2,
  ...QUESTIONS_P3,
  ...QUESTIONS_P4,
];
