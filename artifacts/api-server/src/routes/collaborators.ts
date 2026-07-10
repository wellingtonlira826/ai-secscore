import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  assessmentsTable,
  assessmentCollaboratorsTable,
  usersTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListCollaboratorsParams,
  ListCollaboratorsResponse,
  AddCollaboratorParams,
  AddCollaboratorBody,
  AddCollaboratorResponse,
  RemoveCollaboratorParams,
  ListSharedAssessmentsResponse,
} from "@workspace/api-zod";
import { getAssessmentAccess } from "../lib/access";

const router: IRouter = Router();

// Assessments shared with the current user (collaborator, not owner).
router.get("/shared-assessments", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const email = req.user.email?.toLowerCase();
  if (!email) {
    res.json(ListSharedAssessmentsResponse.parse([]));
    return;
  }

  const rows = await db
    .select({
      id: assessmentsTable.id,
      name: assessmentsTable.name,
      systemName: assessmentsTable.systemName,
      status: assessmentsTable.status,
      role: assessmentCollaboratorsTable.role,
      ownerEmail: usersTable.email,
    })
    .from(assessmentCollaboratorsTable)
    .innerJoin(
      assessmentsTable,
      eq(assessmentsTable.id, assessmentCollaboratorsTable.assessmentId),
    )
    .leftJoin(usersTable, eq(usersTable.id, assessmentsTable.userId))
    .where(eq(assessmentCollaboratorsTable.collaboratorEmail, email))
    .orderBy(assessmentsTable.updatedAt);

  res.json(ListSharedAssessmentsResponse.parse(rows));
});

router.get(
  "/assessments/:assessmentId/collaborators",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = ListCollaboratorsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const access = await getAssessmentAccess(
      params.data.assessmentId,
      req.user.id,
      req.user.email,
    );
    // Only the owner manages sharing.
    if (!access || access.role !== "owner") {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    const collaborators = await db
      .select()
      .from(assessmentCollaboratorsTable)
      .where(
        eq(assessmentCollaboratorsTable.assessmentId, params.data.assessmentId),
      )
      .orderBy(assessmentCollaboratorsTable.createdAt);

    res.json(ListCollaboratorsResponse.parse(collaborators));
  },
);

router.post(
  "/assessments/:assessmentId/collaborators",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = AddCollaboratorParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = AddCollaboratorBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const access = await getAssessmentAccess(
      params.data.assessmentId,
      req.user.id,
      req.user.email,
    );
    if (!access || access.role !== "owner") {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    const email = body.data.collaboratorEmail.toLowerCase();

    // Owner cannot add themselves as a collaborator.
    if (email === req.user.email?.toLowerCase()) {
      res.status(400).json({ error: "You already own this assessment" });
      return;
    }

    // Upsert: if the email is already a collaborator, update the role instead.
    const [existing] = await db
      .select()
      .from(assessmentCollaboratorsTable)
      .where(
        and(
          eq(
            assessmentCollaboratorsTable.assessmentId,
            params.data.assessmentId,
          ),
          eq(assessmentCollaboratorsTable.collaboratorEmail, email),
        ),
      );

    let collaborator;
    if (existing) {
      const [updated] = await db
        .update(assessmentCollaboratorsTable)
        .set({ role: body.data.role })
        .where(eq(assessmentCollaboratorsTable.id, existing.id))
        .returning();
      collaborator = updated;
    } else {
      const [inserted] = await db
        .insert(assessmentCollaboratorsTable)
        .values({
          assessmentId: params.data.assessmentId,
          ownerId: req.user.id,
          collaboratorEmail: email,
          role: body.data.role,
        })
        .returning();
      collaborator = inserted;
    }

    res.status(201).json(AddCollaboratorResponse.parse(collaborator));
  },
);

router.delete(
  "/assessments/:assessmentId/collaborators/:collaboratorId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const params = RemoveCollaboratorParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const access = await getAssessmentAccess(
      params.data.assessmentId,
      req.user.id,
      req.user.email,
    );
    if (!access || access.role !== "owner") {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    const [deleted] = await db
      .delete(assessmentCollaboratorsTable)
      .where(
        and(
          eq(assessmentCollaboratorsTable.id, params.data.collaboratorId),
          eq(
            assessmentCollaboratorsTable.assessmentId,
            params.data.assessmentId,
          ),
        ),
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Collaborator not found" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
