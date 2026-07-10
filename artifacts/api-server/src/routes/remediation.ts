import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { remediationItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListRemediationItemsParams,
  ListRemediationItemsResponse,
  CreateRemediationItemParams,
  CreateRemediationItemBody,
  CreateRemediationItemResponse,
  UpdateRemediationItemParams,
  UpdateRemediationItemBody,
  UpdateRemediationItemResponse,
  DeleteRemediationItemParams,
} from "@workspace/api-zod";
import { getAssessmentAccess, canEdit } from "../lib/access";

const router: IRouter = Router();

router.get(
  "/assessments/:assessmentId/remediation",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = ListRemediationItemsParams.safeParse(req.params);
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

    const items = await db
      .select()
      .from(remediationItemsTable)
      .where(eq(remediationItemsTable.assessmentId, params.data.assessmentId))
      .orderBy(remediationItemsTable.createdAt);

    res.json(ListRemediationItemsResponse.parse(items));
  },
);

router.post(
  "/assessments/:assessmentId/remediation",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = CreateRemediationItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = CreateRemediationItemBody.safeParse(req.body);
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
      res.status(403).json({ error: "Forbidden: read-only access" });
      return;
    }

    const [item] = await db
      .insert(remediationItemsTable)
      .values({
        assessmentId: params.data.assessmentId,
        userId: req.user.id,
        title: body.data.title,
        description: body.data.description ?? null,
        questionId: body.data.questionId ?? null,
        owner: body.data.owner ?? null,
        dueDate: body.data.dueDate ?? null,
        priority: body.data.priority ?? "medium",
        status: body.data.status ?? "open",
      })
      .returning();

    res.status(201).json(CreateRemediationItemResponse.parse(item));
  },
);

router.patch(
  "/assessments/:assessmentId/remediation/:itemId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = UpdateRemediationItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = UpdateRemediationItemBody.safeParse(req.body);
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
      res.status(403).json({ error: "Forbidden: read-only access" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (body.data.title !== undefined) updateData.title = body.data.title;
    if (body.data.description !== undefined)
      updateData.description = body.data.description;
    if (body.data.owner !== undefined) updateData.owner = body.data.owner;
    if (body.data.dueDate !== undefined) updateData.dueDate = body.data.dueDate;
    if (body.data.priority !== undefined) updateData.priority = body.data.priority;
    if (body.data.status !== undefined) updateData.status = body.data.status;

    const [updated] = await db
      .update(remediationItemsTable)
      .set(updateData)
      .where(
        and(
          eq(remediationItemsTable.id, params.data.itemId),
          eq(remediationItemsTable.assessmentId, params.data.assessmentId),
        ),
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Remediation item not found" });
      return;
    }

    res.json(UpdateRemediationItemResponse.parse(updated));
  },
);

router.delete(
  "/assessments/:assessmentId/remediation/:itemId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = DeleteRemediationItemParams.safeParse(req.params);
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
    if (!canEdit(access.role)) {
      res.status(403).json({ error: "Forbidden: read-only access" });
      return;
    }

    const [deleted] = await db
      .delete(remediationItemsTable)
      .where(
        and(
          eq(remediationItemsTable.id, params.data.itemId),
          eq(remediationItemsTable.assessmentId, params.data.assessmentId),
        ),
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Remediation item not found" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
