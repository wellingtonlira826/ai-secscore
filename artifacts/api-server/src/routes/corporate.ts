import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  corpDomainsTable,
  corpQuestionsTable,
  corpAnswersTable,
  maturityLevelsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListCorpDomainsResponse,
  ListCorpQuestionsQueryParams,
  ListCorpQuestionsResponse,
  ListMaturityLevelsResponse,
  ListCorpAnswersParams,
  ListCorpAnswersResponse,
  UpsertCorpAnswerParams,
  UpsertCorpAnswerBody,
  UpsertCorpAnswerResponse,
} from "@workspace/api-zod";
import { getAssessmentAccess, canEdit } from "../lib/access";

const router: IRouter = Router();

// ── Public catalog routes (like /frameworks and /questions) ──────────────────

router.get("/corporate/domains", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: corpDomainsTable.id,
      slug: corpDomainsTable.slug,
      name: corpDomainsTable.name,
      pillar: corpDomainsTable.pillar,
      description: corpDomainsTable.description,
      weight: corpDomainsTable.weight,
      order: corpDomainsTable.order,
      questionCount: sql<number>`count(${corpQuestionsTable.id})::int`,
    })
    .from(corpDomainsTable)
    .leftJoin(corpQuestionsTable, eq(corpQuestionsTable.domainId, corpDomainsTable.id))
    .groupBy(corpDomainsTable.id)
    .orderBy(corpDomainsTable.order);

  res.json(ListCorpDomainsResponse.parse(rows));
});

router.get("/corporate/questions", async (req, res): Promise<void> => {
  const queryParams = ListCorpQuestionsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const domainId = queryParams.data.domainId;

  const rows = await db
    .select()
    .from(corpQuestionsTable)
    .where(domainId != null ? eq(corpQuestionsTable.domainId, domainId) : sql`1=1`)
    .orderBy(corpQuestionsTable.domainId, corpQuestionsTable.order);

  res.json(ListCorpQuestionsResponse.parse(rows));
});

router.get("/corporate/maturity-levels", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(maturityLevelsTable)
    .orderBy(maturityLevelsTable.level);

  res.json(ListMaturityLevelsResponse.parse(rows));
});

// ── Corporate answers (auth + row-scoped) ─────────────────────────────────────

router.get("/assessments/:assessmentId/corporate-answers", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = ListCorpAnswersParams.safeParse(req.params);
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

  const rows = await db
    .select()
    .from(corpAnswersTable)
    .where(eq(corpAnswersTable.assessmentId, params.data.assessmentId));

  res.json(ListCorpAnswersResponse.parse(rows));
});

router.put(
  "/assessments/:assessmentId/corporate-answers/:questionId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = UpsertCorpAnswerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = UpsertCorpAnswerBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
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
    if (!canEdit(access.role)) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    const [question] = await db
      .select()
      .from(corpQuestionsTable)
      .where(eq(corpQuestionsTable.id, params.data.questionId));
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    const values = {
      boolValue: body.data.boolValue ?? null,
      scaleValue: body.data.scaleValue ?? null,
      choiceValue: body.data.choiceValue ?? null,
      textValue: body.data.textValue ?? null,
      percentValue: body.data.percentValue ?? null,
      notes: body.data.notes ?? null,
    };

    const [existing] = await db
      .select()
      .from(corpAnswersTable)
      .where(
        and(
          eq(corpAnswersTable.assessmentId, params.data.assessmentId),
          eq(corpAnswersTable.questionId, params.data.questionId),
        ),
      );

    let saved;
    if (existing) {
      [saved] = await db
        .update(corpAnswersTable)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(corpAnswersTable.id, existing.id))
        .returning();
    } else {
      [saved] = await db
        .insert(corpAnswersTable)
        .values({
          assessmentId: params.data.assessmentId,
          questionId: params.data.questionId,
          ...values,
        })
        .returning();
    }

    res.json(UpsertCorpAnswerResponse.parse(saved));
  },
);

export default router;
