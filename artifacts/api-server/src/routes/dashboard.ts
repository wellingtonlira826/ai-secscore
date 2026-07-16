import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  assessmentsTable,
  answersTable,
  questionsTable,
  frameworksTable,
  userFrameworkWeightsTable,
  corpDomainsTable,
  corpQuestionsTable,
  corpAnswersTable,
} from "@workspace/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import { GetDashboardResponse } from "@workspace/api-zod";
import {
  scoreCorporateAssessment,
  CORP_INDEX_KEYS,
  type CorpIndexKey,
} from "../lib/corporateScoring";

const router: IRouter = Router();

router.get("/dashboard", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  const allAssessments = await db
    .select()
    .from(assessmentsTable)
    .where(eq(assessmentsTable.userId, userId))
    .orderBy(sql`${assessmentsTable.updatedAt} DESC`);

  const totalAssessments = allAssessments.length;
  const inProgressCount = allAssessments.filter((a) => a.status === "in_progress").length;
  const completedCount = allAssessments.filter((a) => a.status === "completed").length;

  const totalQCount = await db.select({ count: sql<number>`count(*)::int` }).from(questionsTable);
  const total = totalQCount[0]?.count ?? 0;

  const recentAssessments = await Promise.all(
    allAssessments.slice(0, 5).map(async (a) => {
      const answered = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(answersTable)
        .where(eq(answersTable.assessmentId, a.id));
      const pct = total > 0 ? Math.round(((answered[0]?.count ?? 0) / total) * 100) : 0;
      return { ...a, completionPct: pct };
    })
  );

  // Compute avg score across all assessments
  let avgScore: number | null = null;
  if (allAssessments.length > 0) {
    const frameworks = await db.select().from(frameworksTable);
    const allQuestions = await db.select({ id: questionsTable.id, frameworkId: questionsTable.frameworkId, weight: questionsTable.weight }).from(questionsTable);
    const userWeights = await db.select().from(userFrameworkWeightsTable).where(eq(userFrameworkWeightsTable.userId, userId));
    const weightMap = new Map(userWeights.map((w) => [w.frameworkId, w.weight]));

    let scoreSum = 0;
    let scoreCount = 0;

    for (const a of allAssessments) {
      const answers = await db.select().from(answersTable).where(eq(answersTable.assessmentId, a.id));
      if (answers.length === 0) continue;

      const answerMap = new Map(answers.map((ans) => [ans.questionId, ans.maturityLevel]));

      const fwScores = frameworks.map((fw) => {
        const fwQs = allQuestions.filter((q) => q.frameworkId === fw.id);
        let ws = 0, tw = 0;
        for (const q of fwQs) {
          const ml = answerMap.get(q.id);
          if (ml == null) continue;
          ws += (ml / 3) * 100 * q.weight;
          tw += q.weight;
        }
        return { score: tw > 0 ? ws / tw : 0, weight: weightMap.get(fw.id) ?? fw.defaultWeight };
      });

      const totalW = fwScores.reduce((s, f) => s + f.weight, 0);
      const overall = totalW > 0 ? fwScores.reduce((s, f) => s + f.score * f.weight, 0) / totalW : 0;
      scoreSum += overall;
      scoreCount++;
    }

    avgScore = scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : null;
  }

  // Top framework scores (average across all assessments)
  const frameworks = await db.select().from(frameworksTable).orderBy(frameworksTable.id);
  const allQuestions2 = await db.select({ id: questionsTable.id, frameworkId: questionsTable.frameworkId, weight: questionsTable.weight }).from(questionsTable);

  const topFrameworkScores = await Promise.all(
    frameworks.map(async (fw) => {
      const fwQs = allQuestions2.filter((q) => q.frameworkId === fw.id);
      let totalScore = 0, count = 0;

      for (const a of allAssessments) {
        const answers = await db.select().from(answersTable).where(
          and(eq(answersTable.assessmentId, a.id))
        );
        if (answers.length === 0) continue;

        const answerMap = new Map(answers.map((ans) => [ans.questionId, ans.maturityLevel]));
        let ws = 0, tw = 0;
        for (const q of fwQs) {
          const ml = answerMap.get(q.id);
          if (ml == null) continue;
          ws += (ml / 3) * 100 * q.weight;
          tw += q.weight;
        }
        if (tw > 0) {
          totalScore += ws / tw;
          count++;
        }
      }

      return {
        frameworkName: fw.name,
        avgScore: count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0,
      };
    })
  );

  // Corporate stats (new platform scope)
  const securityCount = allAssessments.filter((a) => a.type !== "corporate").length;
  const corporateAssessments = allAssessments.filter((a) => a.type === "corporate");
  const corporateCount = corporateAssessments.length;

  let corporateSummary = {
    assessedCount: 0,
    avgOverallScore: null as number | null,
    avgMaturityLevel: null as number | null,
    indices: CORP_INDEX_KEYS.map((key) => ({ key, avgScore: null as number | null })),
  };

  if (corporateCount > 0) {
    const [corpDomains, corpQuestions, corpAnswers] = await Promise.all([
      db.select().from(corpDomainsTable),
      db.select().from(corpQuestionsTable),
      db
        .select()
        .from(corpAnswersTable)
        .where(
          inArray(
            corpAnswersTable.assessmentId,
            corporateAssessments.map((a) => a.id)
          )
        ),
    ]);

    const answersByAssessment = new Map<number, typeof corpAnswers>();
    for (const ans of corpAnswers) {
      const list = answersByAssessment.get(ans.assessmentId);
      if (list) list.push(ans);
      else answersByAssessment.set(ans.assessmentId, [ans]);
    }

    let scoreSum = 0;
    let levelSum = 0;
    let assessedCount = 0;
    const indexSums = new Map<CorpIndexKey, { sum: number; count: number }>(
      CORP_INDEX_KEYS.map((k) => [k, { sum: 0, count: 0 }])
    );

    for (const a of corporateAssessments) {
      const answers = answersByAssessment.get(a.id) ?? [];
      if (answers.length === 0) continue;
      const score = scoreCorporateAssessment(a.id, corpDomains, corpQuestions, answers);
      if (score.overallScore == null) continue;
      assessedCount++;
      scoreSum += score.overallScore;
      levelSum += score.maturityLevel ?? 0;
      for (const idx of score.indices) {
        if (idx.score == null) continue;
        const acc = indexSums.get(idx.key as CorpIndexKey);
        if (acc) {
          acc.sum += idx.score;
          acc.count++;
        }
      }
    }

    if (assessedCount > 0) {
      corporateSummary = {
        assessedCount,
        avgOverallScore: Math.round((scoreSum / assessedCount) * 10) / 10,
        avgMaturityLevel: Math.round(levelSum / assessedCount),
        indices: CORP_INDEX_KEYS.map((key) => {
          const acc = indexSums.get(key)!;
          return {
            key,
            avgScore: acc.count > 0 ? Math.round((acc.sum / acc.count) * 10) / 10 : null,
          };
        }),
      };
    } else {
      corporateSummary = { ...corporateSummary, assessedCount: 0 };
    }
  }

  const result = {
    totalAssessments,
    inProgressCount,
    completedCount,
    avgScore,
    securityCount,
    corporateCount,
    corporateSummary,
    recentAssessments,
    topFrameworkScores,
  };

  res.json(GetDashboardResponse.parse(result));
});

export default router;
