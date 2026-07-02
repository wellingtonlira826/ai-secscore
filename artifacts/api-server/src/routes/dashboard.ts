import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  assessmentsTable,
  answersTable,
  questionsTable,
  frameworksTable,
  userFrameworkWeightsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { GetDashboardResponse } from "@workspace/api-zod";

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

  const result = {
    totalAssessments,
    inProgressCount,
    completedCount,
    avgScore,
    recentAssessments,
    topFrameworkScores,
  };

  res.json(GetDashboardResponse.parse(result));
});

export default router;
