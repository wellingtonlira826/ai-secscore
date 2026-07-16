import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  corpDomainsTable,
  corpQuestionsTable,
  corpAnswersTable,
  maturityLevelsTable,
  corpBenchmarkProfilesTable,
  corpBenchmarkScoresTable,
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
  ListCorpBenchmarkProfilesResponse,
  GetCorporateScoreParams,
  GetCorporateScoreResponse,
  GetCorporateBenchmarkParams,
  GetCorporateBenchmarkQueryParams,
  GetCorporateBenchmarkResponse,
} from "@workspace/api-zod";
import { getAssessmentAccess, canEdit } from "../lib/access";
import { scoreCorporateAssessment } from "../lib/corporateScoring";
import { loadCorporateScoringContext } from "../lib/corporateScoringContext";

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

router.get("/corporate/benchmark-profiles", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(corpBenchmarkProfilesTable)
    .orderBy(corpBenchmarkProfilesTable.order);

  res.json(ListCorpBenchmarkProfilesResponse.parse(rows));
});

// ── Corporate scoring & benchmark (auth + row-scoped) ─────────────────────────

router.get("/assessments/:assessmentId/corporate-score", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetCorporateScoreParams.safeParse(req.params);
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

  const ctx = await loadCorporateScoringContext(params.data.assessmentId);
  const result = scoreCorporateAssessment(
    params.data.assessmentId,
    ctx.domains,
    ctx.questions,
    ctx.answers,
  );

  res.json(GetCorporateScoreResponse.parse(result));
});

router.get(
  "/assessments/:assessmentId/corporate-benchmark",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = GetCorporateBenchmarkParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const query = GetCorporateBenchmarkQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
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

    const [profile] = await db
      .select()
      .from(corpBenchmarkProfilesTable)
      .where(eq(corpBenchmarkProfilesTable.slug, query.data.profile));
    if (!profile) {
      res.status(400).json({ error: "Unknown benchmark profile" });
      return;
    }

    const [ctx, benchmarkRows] = await Promise.all([
      loadCorporateScoringContext(params.data.assessmentId),
      db
        .select()
        .from(corpBenchmarkScoresTable)
        .where(eq(corpBenchmarkScoresTable.profileSlug, profile.slug)),
    ]);

    const result = scoreCorporateAssessment(
      params.data.assessmentId,
      ctx.domains,
      ctx.questions,
      ctx.answers,
    );

    const benchmarkByDomain = new Map(benchmarkRows.map((r) => [r.domainSlug, r.score]));
    const round1 = (n: number) => Math.round(n * 10) / 10;

    const domains = result.domains
      .filter((d) => benchmarkByDomain.has(d.slug))
      .map((d) => {
        const benchmarkScore = benchmarkByDomain.get(d.slug) as number;
        return {
          domainId: d.domainId,
          slug: d.slug,
          name: d.name,
          pillar: d.pillar,
          clientScore: d.score,
          benchmarkScore,
          delta: d.score != null ? round1(d.score - benchmarkScore) : null,
        };
      });

    const weightBySlug = new Map(result.domains.map((d) => [d.slug, d.weight]));
    const weightedAvg = (
      rows: Array<{ slug: string; value: number | null }>,
    ): number | null => {
      let sum = 0;
      let weight = 0;
      for (const r of rows) {
        if (r.value == null) continue;
        const w = weightBySlug.get(r.slug) ?? 1;
        sum += r.value * w;
        weight += w;
      }
      return weight > 0 ? round1(sum / weight) : null;
    };

    const pillarNames: string[] = [];
    for (const d of domains) {
      if (!pillarNames.includes(d.pillar)) pillarNames.push(d.pillar);
    }
    const pillars = pillarNames.map((pillar) => {
      const items = domains.filter((d) => d.pillar === pillar);
      const clientScore = weightedAvg(items.map((d) => ({ slug: d.slug, value: d.clientScore })));
      const benchmarkScore =
        weightedAvg(items.map((d) => ({ slug: d.slug, value: d.benchmarkScore }))) ?? 0;
      return {
        pillar,
        clientScore,
        benchmarkScore,
        delta: clientScore != null ? round1(clientScore - benchmarkScore) : null,
      };
    });

    const overallBenchmark =
      weightedAvg(domains.map((d) => ({ slug: d.slug, value: d.benchmarkScore }))) ?? 0;
    const overallClient = result.overallScore;

    res.json(
      GetCorporateBenchmarkResponse.parse({
        profileSlug: profile.slug,
        profileName: profile.name,
        profileDescription: profile.description,
        overallClient,
        overallBenchmark,
        overallDelta: overallClient != null ? round1(overallClient - overallBenchmark) : null,
        pillars,
        domains,
      }),
    );
  },
);

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
