import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  answersTable,
  questionsTable,
  frameworksTable,
  userFrameworkWeightsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetComplianceViewParams,
  GetComplianceViewResponse,
} from "@workspace/api-zod";
import { getAssessmentAccess } from "../lib/access";

const router: IRouter = Router();

function riskFor(score: number): "Critical" | "High" | "Medium" | "Low" {
  return score >= 75 ? "Low" : score >= 60 ? "Medium" : score >= 40 ? "High" : "Critical";
}

router.get(
  "/assessments/:assessmentId/compliance",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = GetComplianceViewParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const access = await getAssessmentAccess(
      params.data.assessmentId,
      req.user.id,
      req.user.email,
    );
    if (!access) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    // Scoring uses the OWNER's framework weights so the shared view is
    // consistent regardless of who is viewing it.
    const ownerId = access.assessment.userId;

    const frameworks = await db
      .select()
      .from(frameworksTable)
      .orderBy(frameworksTable.id);
    const allQuestions = await db
      .select({
        id: questionsTable.id,
        frameworkId: questionsTable.frameworkId,
        weight: questionsTable.weight,
      })
      .from(questionsTable);
    const answers = await db
      .select()
      .from(answersTable)
      .where(eq(answersTable.assessmentId, params.data.assessmentId));
    const userWeights = await db
      .select()
      .from(userFrameworkWeightsTable)
      .where(eq(userFrameworkWeightsTable.userId, ownerId));

    const weightMap = new Map(userWeights.map((w) => [w.frameworkId, w.weight]));
    const answerMap = new Map(answers.map((a) => [a.questionId, a.maturityLevel]));

    const frameworkScores = frameworks.map((fw) => {
      const fwQs = allQuestions.filter((q) => q.frameworkId === fw.id);
      let weightedSum = 0;
      let totalWeight = 0;
      let answered = 0;

      for (const q of fwQs) {
        const ml = answerMap.get(q.id);
        if (ml === undefined || ml === null) continue;
        weightedSum += (ml / 3) * 100 * q.weight;
        totalWeight += q.weight;
        answered++;
      }

      const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
      return {
        frameworkId: fw.id,
        frameworkName: fw.name,
        referenceUrl: fw.referenceUrl ?? null,
        category: fw.category ?? "Other",
        score,
        riskLevel: riskFor(score),
        answeredCount: answered,
        totalCount: fwQs.length,
        userWeight: weightMap.get(fw.id) ?? fw.defaultWeight,
      };
    });

    // Group frameworks by their standard category.
    const categoryMap = new Map<string, typeof frameworkScores>();
    for (const fs of frameworkScores) {
      const list = categoryMap.get(fs.category);
      if (list) list.push(fs);
      else categoryMap.set(fs.category, [fs]);
    }

    const categories = Array.from(categoryMap.entries()).map(
      ([category, list]) => {
        const avgScore =
          list.length > 0
            ? Math.round(
                (list.reduce((s, f) => s + f.score, 0) / list.length) * 10,
              ) / 10
            : 0;
        return {
          category,
          avgScore,
          frameworks: list.map(({ category: _c, userWeight: _w, ...rest }) => rest),
        };
      },
    );

    // Weighted overall score (matches the assessment score endpoint).
    const totalWeight = frameworkScores.reduce((s, f) => s + f.userWeight, 0);
    const overallScore =
      totalWeight > 0
        ? Math.round(
            (frameworkScores.reduce((s, f) => s + f.score * f.userWeight, 0) /
              totalWeight) *
              10,
          ) / 10
        : 0;

    const result = {
      assessmentId: params.data.assessmentId,
      overallScore,
      categories,
    };

    res.json(GetComplianceViewResponse.parse(result));
  },
);

export default router;
