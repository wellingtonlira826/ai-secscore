// Loads the corporate scoring reference data (domains + questions + answers)
// once per request, mirroring the loadScoringContext pattern used by the
// security scoring engine. All computation happens in the pure functions in
// ./corporateScoring.
import { db } from "@workspace/db";
import { corpDomainsTable, corpQuestionsTable, corpAnswersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type {
  CorpScoringDomain,
  CorpScoringQuestion,
  CorpScoringAnswer,
} from "./corporateScoring";

export type CorporateScoringContext = {
  domains: CorpScoringDomain[];
  questions: CorpScoringQuestion[];
  answers: CorpScoringAnswer[];
};

export async function loadCorporateScoringContext(
  assessmentId: number,
): Promise<CorporateScoringContext> {
  const [domains, questions, answers] = await Promise.all([
    db.select().from(corpDomainsTable),
    db.select().from(corpQuestionsTable),
    db
      .select()
      .from(corpAnswersTable)
      .where(eq(corpAnswersTable.assessmentId, assessmentId)),
  ]);

  return { domains, questions, answers };
}
