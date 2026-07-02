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
import {
  ListAssessmentsResponse,
  CreateAssessmentBody,
  CreateAssessmentResponse,
  GetAssessmentParams,
  GetAssessmentResponse,
  UpdateAssessmentParams,
  UpdateAssessmentBody,
  UpdateAssessmentResponse,
  DeleteAssessmentParams,
  ListAnswersParams,
  ListAnswersResponse,
  UpsertAnswerParams,
  UpsertAnswerBody,
  UpsertAnswerResponse,
  GetAssessmentScoreParams,
  GetAssessmentScoreResponse,
  GetAssessmentGapsParams,
  GetAssessmentGapsResponse,
  GetAssessmentSummaryParams,
  GetAssessmentSummaryResponse,
  CompareAssessmentsQueryParams,
  CompareAssessmentsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function computeCompletionPct(assessmentId: number, userId: string): Promise<number> {
  const totalQs = await db.select({ count: sql<number>`count(*)::int` }).from(questionsTable);
  const answeredQs = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(answersTable)
    .where(
      and(
        eq(answersTable.assessmentId, assessmentId),
        sql`${answersTable.maturityLevel} IS NOT NULL OR ${answersTable.maturityLevel} IS NULL`
      )
    );

  const total = totalQs[0]?.count ?? 0;
  const answered = answeredQs[0]?.count ?? 0;
  if (total === 0) return 0;
  return Math.round((answered / total) * 100);
}

async function computeScore(assessmentId: number, userId: string) {
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
    .where(eq(answersTable.assessmentId, assessmentId));

  const answerMap = new Map(answers.map((a) => [a.questionId, a.maturityLevel]));

  const frameworks = await db.select().from(frameworksTable).orderBy(frameworksTable.id);

  const userWeights = await db
    .select()
    .from(userFrameworkWeightsTable)
    .where(eq(userFrameworkWeightsTable.userId, userId));

  const weightMap = new Map(userWeights.map((w) => [w.frameworkId, w.weight]));

  // Compute per-framework scores
  const frameworkScores = frameworks.map((fw) => {
    const fwQs = allQuestions.filter((q) => q.frameworkId === fw.id);
    let weightedSum = 0;
    let totalWeight = 0;
    let answered = 0;

    for (const q of fwQs) {
      const ml = answerMap.get(q.id);
      if (ml === undefined) continue; // not answered
      if (ml === null) continue; // N/A — skip from scoring
      // ml is 0-3, normalize to 0-100
      const normalizedScore = (ml / 3) * 100;
      weightedSum += normalizedScore * q.weight;
      totalWeight += q.weight;
      answered++;
    }

    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const riskLevel = score >= 75 ? "Low" : score >= 60 ? "Medium" : score >= 40 ? "High" : "Critical";

    return {
      frameworkId: fw.id,
      frameworkName: fw.name,
      score: Math.round(score * 10) / 10,
      riskLevel: riskLevel as "Critical" | "High" | "Medium" | "Low",
      answeredCount: answered,
      totalCount: fwQs.length,
      weight: weightMap.get(fw.id) ?? fw.defaultWeight,
    };
  });

  // Weighted overall score
  const totalWeight = frameworkScores.reduce((s, f) => s + f.weight, 0);
  const overallScore =
    totalWeight > 0
      ? frameworkScores.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight
      : 0;

  const rounded = Math.round(overallScore * 10) / 10;
  const grade =
    rounded >= 90 ? "A" : rounded >= 75 ? "B" : rounded >= 60 ? "C" : rounded >= 40 ? "D" : "F";
  const riskLevel =
    rounded >= 75 ? "Low" : rounded >= 60 ? "Medium" : rounded >= 40 ? "High" : "Critical";

  const answeredCount = answers.length;
  const totalCount = allQuestions.length;

  return {
    assessmentId,
    overallScore: rounded,
    grade: grade as "A" | "B" | "C" | "D" | "F",
    riskLevel: riskLevel as "Critical" | "High" | "Medium" | "Low",
    frameworkScores: frameworkScores.map(({ weight: _w, ...rest }) => rest),
    answeredCount,
    totalCount,
  };
}

// ── Assessments CRUD ──────────────────────────────────────────────────────────

router.get("/assessments", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  const assessments = await db
    .select()
    .from(assessmentsTable)
    .where(eq(assessmentsTable.userId, userId))
    .orderBy(sql`${assessmentsTable.updatedAt} DESC`);

  // Compute completion pct
  const totalQCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questionsTable);
  const total = totalQCount[0]?.count ?? 0;

  const withPct = await Promise.all(
    assessments.map(async (a) => {
      const answered = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(answersTable)
        .where(eq(answersTable.assessmentId, a.id));
      const pct = total > 0 ? Math.round(((answered[0]?.count ?? 0) / total) * 100) : 0;
      return { ...a, completionPct: pct };
    })
  );

  res.json(ListAssessmentsResponse.parse(withPct));
});

router.get("/assessments/compare", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const params = CompareAssessmentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { id1, id2 } = params.data;

  const [a1] = await db
    .select()
    .from(assessmentsTable)
    .where(and(eq(assessmentsTable.id, id1), eq(assessmentsTable.userId, userId)));

  const [a2] = await db
    .select()
    .from(assessmentsTable)
    .where(and(eq(assessmentsTable.id, id2), eq(assessmentsTable.userId, userId)));

  if (!a1 || !a2) {
    res.status(404).json({ error: "One or both assessments not found" });
    return;
  }

  const score1 = await computeScore(id1, userId);
  const score2 = await computeScore(id2, userId);

  const frameworkDiffs = score1.frameworkScores.map((fs1) => {
    const fs2 = score2.frameworkScores.find((f) => f.frameworkId === fs1.frameworkId);
    return {
      frameworkId: fs1.frameworkId,
      frameworkName: fs1.frameworkName,
      score1: fs1.score,
      score2: fs2?.score ?? 0,
      diff: (fs2?.score ?? 0) - fs1.score,
    };
  });

  const result = {
    assessment1: score1,
    assessment2: score2,
    overallDiff: score2.overallScore - score1.overallScore,
    frameworkDiffs,
  };

  res.json(CompareAssessmentsResponse.parse(result));
});

router.post("/assessments", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateAssessmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user.id;

  const [assessment] = await db
    .insert(assessmentsTable)
    .values({
      userId,
      name: parsed.data.name,
      systemName: parsed.data.systemName,
      description: parsed.data.description ?? null,
      status: "in_progress",
    })
    .returning();

  res.status(201).json(CreateAssessmentResponse.parse({ ...assessment, completionPct: 0 }));
});

router.get("/assessments/:assessmentId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetAssessmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user.id;
  const [assessment] = await db
    .select()
    .from(assessmentsTable)
    .where(
      and(
        eq(assessmentsTable.id, params.data.assessmentId),
        eq(assessmentsTable.userId, userId)
      )
    );

  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  const totalQCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questionsTable);
  const total = totalQCount[0]?.count ?? 0;
  const answered = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(answersTable)
    .where(eq(answersTable.assessmentId, assessment.id));
  const completionPct = total > 0 ? Math.round(((answered[0]?.count ?? 0) / total) * 100) : 0;

  res.json(GetAssessmentResponse.parse({ ...assessment, completionPct }));
});

router.patch("/assessments/:assessmentId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateAssessmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateAssessmentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const userId = req.user.id;
  const updateData: Record<string, unknown> = {};
  if (body.data.name !== undefined) updateData.name = body.data.name;
  if (body.data.systemName !== undefined) updateData.systemName = body.data.systemName;
  if (body.data.description !== undefined) updateData.description = body.data.description;
  if (body.data.status !== undefined) updateData.status = body.data.status;

  const [updated] = await db
    .update(assessmentsTable)
    .set(updateData)
    .where(
      and(
        eq(assessmentsTable.id, params.data.assessmentId),
        eq(assessmentsTable.userId, userId)
      )
    )
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  const totalQCount = await db.select({ count: sql<number>`count(*)::int` }).from(questionsTable);
  const total = totalQCount[0]?.count ?? 0;
  const answered = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(answersTable)
    .where(eq(answersTable.assessmentId, updated.id));
  const completionPct = total > 0 ? Math.round(((answered[0]?.count ?? 0) / total) * 100) : 0;

  res.json(UpdateAssessmentResponse.parse({ ...updated, completionPct }));
});

router.delete("/assessments/:assessmentId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteAssessmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user.id;

  // Verify ownership before any mutation
  const [deleted] = await db
    .delete(assessmentsTable)
    .where(
      and(
        eq(assessmentsTable.id, params.data.assessmentId),
        eq(assessmentsTable.userId, userId)
      )
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  // Only delete answers after ownership is confirmed
  await db
    .delete(answersTable)
    .where(eq(answersTable.assessmentId, params.data.assessmentId));

  res.sendStatus(204);
});

// ── Answers ───────────────────────────────────────────────────────────────────

router.get("/assessments/:assessmentId/answers", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = ListAnswersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user.id;
  const [assessment] = await db
    .select()
    .from(assessmentsTable)
    .where(
      and(
        eq(assessmentsTable.id, params.data.assessmentId),
        eq(assessmentsTable.userId, userId)
      )
    );

  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  const answers = await db
    .select()
    .from(answersTable)
    .where(eq(answersTable.assessmentId, params.data.assessmentId));

  res.json(ListAnswersResponse.parse(answers));
});

router.put("/assessments/:assessmentId/answers/:questionId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpsertAnswerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpsertAnswerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const userId = req.user.id;

  // Verify ownership
  const [assessment] = await db
    .select()
    .from(assessmentsTable)
    .where(
      and(
        eq(assessmentsTable.id, params.data.assessmentId),
        eq(assessmentsTable.userId, userId)
      )
    );

  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  // Upsert answer
  const existing = await db
    .select()
    .from(answersTable)
    .where(
      and(
        eq(answersTable.assessmentId, params.data.assessmentId),
        eq(answersTable.questionId, params.data.questionId)
      )
    );

  let answer;
  if (existing.length > 0) {
    const [updated] = await db
      .update(answersTable)
      .set({
        maturityLevel: body.data.maturityLevel ?? null,
        notes: body.data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(answersTable.assessmentId, params.data.assessmentId),
          eq(answersTable.questionId, params.data.questionId)
        )
      )
      .returning();
    answer = updated;
  } else {
    const [inserted] = await db
      .insert(answersTable)
      .values({
        assessmentId: params.data.assessmentId,
        questionId: params.data.questionId,
        maturityLevel: body.data.maturityLevel ?? null,
        notes: body.data.notes ?? null,
        updatedAt: new Date(),
      })
      .returning();
    answer = inserted;
  }

  res.json(UpsertAnswerResponse.parse(answer));
});

// ── Scoring & Results ─────────────────────────────────────────────────────────

router.get("/assessments/:assessmentId/score", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetAssessmentScoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user.id;
  const [assessment] = await db
    .select()
    .from(assessmentsTable)
    .where(
      and(
        eq(assessmentsTable.id, params.data.assessmentId),
        eq(assessmentsTable.userId, userId)
      )
    );

  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  const score = await computeScore(params.data.assessmentId, userId);
  res.json(GetAssessmentScoreResponse.parse(score));
});

router.get("/assessments/:assessmentId/gaps", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetAssessmentGapsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user.id;
  const [assessment] = await db
    .select()
    .from(assessmentsTable)
    .where(
      and(
        eq(assessmentsTable.id, params.data.assessmentId),
        eq(assessmentsTable.userId, userId)
      )
    );

  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  const allQuestions = await db
    .select({
      id: questionsTable.id,
      frameworkId: questionsTable.frameworkId,
      frameworkName: frameworksTable.name,
      section: questionsTable.section,
      text: questionsTable.text,
      weight: questionsTable.weight,
      remediation: questionsTable.remediation,
    })
    .from(questionsTable)
    .innerJoin(frameworksTable, eq(frameworksTable.id, questionsTable.frameworkId));

  const answers = await db
    .select()
    .from(answersTable)
    .where(eq(answersTable.assessmentId, params.data.assessmentId));

  const answerMap = new Map(answers.map((a) => [a.questionId, a.maturityLevel]));

  const gaps = allQuestions
    .map((q) => {
      const ml = answerMap.get(q.id);
      const score = ml == null ? 0 : (ml / 3) * 100;
      return {
        questionId: q.id,
        questionText: q.text,
        section: q.section,
        frameworkId: q.frameworkId,
        frameworkName: q.frameworkName,
        weight: q.weight,
        score,
        maturityLevel: ml ?? null,
        remediation: q.remediation ?? null,
      };
    })
    .filter((g) => {
      const ml = answerMap.get(g.questionId);
      return ml == null || ml < 3;
    })
    .sort((a, b) => {
      // Sort by weight desc, then score asc
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.score - b.score;
    })
    .slice(0, 10);

  res.json(GetAssessmentGapsResponse.parse(gaps));
});

router.get("/assessments/:assessmentId/summary", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetAssessmentSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user.id;
  const [assessment] = await db
    .select()
    .from(assessmentsTable)
    .where(
      and(
        eq(assessmentsTable.id, params.data.assessmentId),
        eq(assessmentsTable.userId, userId)
      )
    );

  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  const score = await computeScore(params.data.assessmentId, userId);
  const { overallScore, grade, frameworkScores } = score;

  const riskLabel = overallScore >= 75 ? "Low" : overallScore >= 60 ? "Medium" : overallScore >= 40 ? "High" : "Critical";

  const topFrameworks = [...frameworkScores].sort((a, b) => b.score - a.score);
  const bestFramework = topFrameworks[0];
  const worstFramework = topFrameworks[topFrameworks.length - 1];

  const summaryText = `This executive summary presents the AI security assessment results for "${assessment.systemName}" conducted as part of the "${assessment.name}" assessment. The system achieved an overall AI Security Score of ${overallScore.toFixed(1)}/100, earning a grade of "${grade}" with an overall risk level classified as "${riskLabel}". ${
    overallScore >= 75
      ? "The system demonstrates a commendable security posture with solid foundational controls across the evaluated frameworks."
      : overallScore >= 60
      ? "The system demonstrates partial implementation of AI security controls with notable gaps requiring attention."
      : overallScore >= 40
      ? "The system has significant security gaps that pose elevated risk and require prioritized remediation efforts."
      : "The system has critical security deficiencies that require immediate and comprehensive remediation."
  }`;

  const strengths = topFrameworks
    .slice(0, 3)
    .filter((f) => f.score >= 60)
    .map((f) => `${f.frameworkName}: score of ${f.score.toFixed(1)}/100 (${f.riskLevel} risk)`);

  const weaknesses = topFrameworks
    .slice(-3)
    .filter((f) => f.score < 75)
    .reverse()
    .map((f) => `${f.frameworkName}: score of ${f.score.toFixed(1)}/100 (${f.riskLevel} risk)`);

  const recommendations = [
    worstFramework
      ? `Prioritize remediation of ${worstFramework.frameworkName} controls (current score: ${worstFramework.score.toFixed(1)}/100).`
      : null,
    "Conduct a detailed gap analysis for all high-weight questions scoring below 2 (Largely Implemented).",
    "Establish a quarterly AI security review cycle to track remediation progress.",
    overallScore < 75
      ? "Engage a third-party AI security assessment to validate findings and provide independent verification."
      : "Maintain current security posture and consider pursuing formal certification (e.g., ISO/IEC 42001).",
    "Implement continuous monitoring and alerting for AI-specific threats identified in this assessment.",
  ].filter(Boolean) as string[];

  const result = {
    assessmentId: assessment.id,
    assessmentName: assessment.name,
    systemName: assessment.systemName,
    overallScore,
    grade,
    summaryText,
    strengths: strengths.length > 0 ? strengths : ["Assessment in progress — complete more questions to identify strengths."],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["Assessment in progress — complete more questions to identify weaknesses."],
    recommendations,
  };

  res.json(GetAssessmentSummaryResponse.parse(result));
});

export default router;
