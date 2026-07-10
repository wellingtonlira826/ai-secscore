import { db } from "@workspace/db";
import { assessmentsTable, assessmentCollaboratorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export type AssessmentRole = "owner" | "editor" | "viewer";

export interface AssessmentAccess {
  assessment: typeof assessmentsTable.$inferSelect;
  role: AssessmentRole;
}

/**
 * Resolve a user's access to an assessment.
 *
 * Access is granted to the owner (assessment.userId) or to a collaborator whose
 * email matches a row in assessment_collaborators (case-insensitive). Returns
 * null when the assessment does not exist or the user has no relationship to it,
 * so callers can respond with 404 and never disclose existence to outsiders.
 */
export async function getAssessmentAccess(
  assessmentId: number,
  userId: string,
  userEmail: string | null | undefined,
): Promise<AssessmentAccess | null> {
  const [assessment] = await db
    .select()
    .from(assessmentsTable)
    .where(eq(assessmentsTable.id, assessmentId));

  if (!assessment) return null;

  if (assessment.userId === userId) {
    return { assessment, role: "owner" };
  }

  const email = userEmail?.toLowerCase();
  if (!email) return null;

  const [collab] = await db
    .select()
    .from(assessmentCollaboratorsTable)
    .where(
      and(
        eq(assessmentCollaboratorsTable.assessmentId, assessmentId),
        eq(assessmentCollaboratorsTable.collaboratorEmail, email),
      ),
    );

  if (!collab) return null;
  return { assessment, role: collab.role };
}

export function canEdit(role: AssessmentRole): boolean {
  return role === "owner" || role === "editor";
}
