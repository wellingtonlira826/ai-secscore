export type CorpAnswerType = "yes_no" | "scale_1_5" | "multiple_choice" | "text" | "percent";
export type CorpCriticality = "baixa" | "media" | "alta" | "critica";

export type CorpDomainSeed = {
  slug: string;
  name: string;
  pillar: string;
  description: string;
  weight: number;
  order: number;
};

export type CorpQuestionSeed = {
  domainSlug: string;
  order: number;
  text: string;
  description: string;
  objective: string;
  justification: string;
  marketReference: string;
  criticality: CorpCriticality;
  weight: number; // 1-5
  answerType: CorpAnswerType;
  options?: string[]; // required when answerType === "multiple_choice"
  required: boolean;
  eliminatory: boolean;
};
