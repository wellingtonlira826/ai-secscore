import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { evidenceTable, assessmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListEvidenceParams,
  ListEvidenceResponse,
  AddEvidenceParams,
  AddEvidenceBody,
  AddEvidenceResponse,
  DeleteEvidenceParams,
  ListAllEvidenceParams,
  ListAllEvidenceResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get(
  "/assessments/:assessmentId/answers/:questionId/evidence",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = ListEvidenceParams.safeParse(req.params);
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

    const evidence = await db
      .select()
      .from(evidenceTable)
      .where(
        and(
          eq(evidenceTable.assessmentId, params.data.assessmentId),
          eq(evidenceTable.questionId, params.data.questionId)
        )
      )
      .orderBy(evidenceTable.createdAt);

    res.json(ListEvidenceResponse.parse(evidence));
  }
);

router.post(
  "/assessments/:assessmentId/answers/:questionId/evidence",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = AddEvidenceParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = AddEvidenceBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
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

    const [evidence] = await db
      .insert(evidenceTable)
      .values({
        assessmentId: params.data.assessmentId,
        questionId: params.data.questionId,
        userId,
        fileName: body.data.fileName,
        fileSize: body.data.fileSize,
        contentType: body.data.contentType,
        objectPath: body.data.objectPath,
        description: body.data.description ?? null,
      })
      .returning();

    res.status(201).json(AddEvidenceResponse.parse(evidence));
  }
);

router.delete(
  "/assessments/:assessmentId/evidence/:evidenceId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = DeleteEvidenceParams.safeParse(req.params);
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

    const [deleted] = await db
      .delete(evidenceTable)
      .where(
        and(
          eq(evidenceTable.id, params.data.evidenceId),
          eq(evidenceTable.assessmentId, params.data.assessmentId)
        )
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Evidence not found" });
      return;
    }

    res.sendStatus(204);
  }
);

router.get(
  "/assessments/:assessmentId/evidence",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = ListAllEvidenceParams.safeParse(req.params);
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

    const evidence = await db
      .select()
      .from(evidenceTable)
      .where(eq(evidenceTable.assessmentId, params.data.assessmentId))
      .orderBy(evidenceTable.createdAt);

    res.json(ListAllEvidenceResponse.parse(evidence));
  }
);

export default router;
