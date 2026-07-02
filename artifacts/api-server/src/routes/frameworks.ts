import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  frameworksTable,
  questionsTable,
  userFrameworkWeightsTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  ListFrameworksResponse,
  GetFrameworkParams,
  GetFrameworkResponse,
  ListQuestionsQueryParams,
  ListQuestionsResponse,
  ListFrameworkWeightsResponse,
  UpdateFrameworkWeightsBody,
  UpdateFrameworkWeightsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/frameworks", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: frameworksTable.id,
      name: frameworksTable.name,
      slug: frameworksTable.slug,
      description: frameworksTable.description,
      defaultWeight: frameworksTable.defaultWeight,
      questionCount: sql<number>`count(${questionsTable.id})::int`,
    })
    .from(frameworksTable)
    .leftJoin(questionsTable, eq(questionsTable.frameworkId, frameworksTable.id))
    .groupBy(frameworksTable.id)
    .orderBy(frameworksTable.id);

  res.json(ListFrameworksResponse.parse(rows));
});

router.get("/frameworks/:frameworkId", async (req, res): Promise<void> => {
  const params = GetFrameworkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [fw] = await db
    .select()
    .from(frameworksTable)
    .where(eq(frameworksTable.id, params.data.frameworkId));

  if (!fw) {
    res.status(404).json({ error: "Framework not found" });
    return;
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.frameworkId, fw.id))
    .orderBy(questionsTable.order);

  const result = {
    ...fw,
    questions: questions.map((q) => ({
      ...q,
      frameworkName: fw.name,
    })),
  };

  res.json(GetFrameworkResponse.parse(result));
});

router.get("/questions", async (req, res): Promise<void> => {
  const queryParams = ListQuestionsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const frameworkId = queryParams.data.frameworkId;

  const fwJoined = await db
    .select({
      id: questionsTable.id,
      frameworkId: questionsTable.frameworkId,
      frameworkName: frameworksTable.name,
      section: questionsTable.section,
      text: questionsTable.text,
      weight: questionsTable.weight,
      order: questionsTable.order,
      remediation: questionsTable.remediation,
    })
    .from(questionsTable)
    .innerJoin(frameworksTable, eq(frameworksTable.id, questionsTable.frameworkId))
    .where(frameworkId != null ? eq(questionsTable.frameworkId, frameworkId) : sql`1=1`)
    .orderBy(questionsTable.frameworkId, questionsTable.order);

  res.json(ListQuestionsResponse.parse(fwJoined));
});

// ── Framework weights ─────────────────────────────────────────────────────────
router.get("/framework-weights", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  const frameworks = await db
    .select({
      id: frameworksTable.id,
      name: frameworksTable.name,
      defaultWeight: frameworksTable.defaultWeight,
    })
    .from(frameworksTable)
    .orderBy(frameworksTable.id);

  const userWeights = await db
    .select()
    .from(userFrameworkWeightsTable)
    .where(eq(userFrameworkWeightsTable.userId, userId));

  const weightMap = new Map(userWeights.map((w) => [w.frameworkId, w.weight]));

  const result = frameworks.map((fw) => ({
    frameworkId: fw.id,
    frameworkName: fw.name,
    weight: weightMap.get(fw.id) ?? fw.defaultWeight,
  }));

  res.json(ListFrameworkWeightsResponse.parse(result));
});

router.put("/framework-weights", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const parsed = UpdateFrameworkWeightsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  for (const entry of parsed.data.weights) {
    const existing = await db
      .select()
      .from(userFrameworkWeightsTable)
      .where(
        sql`${userFrameworkWeightsTable.userId} = ${userId} AND ${userFrameworkWeightsTable.frameworkId} = ${entry.frameworkId}`
      );

    if (existing.length > 0) {
      await db
        .update(userFrameworkWeightsTable)
        .set({ weight: entry.weight, updatedAt: new Date() })
        .where(
          sql`${userFrameworkWeightsTable.userId} = ${userId} AND ${userFrameworkWeightsTable.frameworkId} = ${entry.frameworkId}`
        );
    } else {
      await db.insert(userFrameworkWeightsTable).values({
        userId,
        frameworkId: entry.frameworkId,
        weight: entry.weight,
        updatedAt: new Date(),
      });
    }
  }

  // Return updated weights
  const frameworks = await db
    .select({ id: frameworksTable.id, name: frameworksTable.name, defaultWeight: frameworksTable.defaultWeight })
    .from(frameworksTable)
    .orderBy(frameworksTable.id);

  const userWeights = await db
    .select()
    .from(userFrameworkWeightsTable)
    .where(eq(userFrameworkWeightsTable.userId, userId));

  const weightMap = new Map(userWeights.map((w) => [w.frameworkId, w.weight]));

  const result = frameworks.map((fw) => ({
    frameworkId: fw.id,
    frameworkName: fw.name,
    weight: weightMap.get(fw.id) ?? fw.defaultWeight,
  }));

  res.json(UpdateFrameworkWeightsResponse.parse(result));
});

export default router;
