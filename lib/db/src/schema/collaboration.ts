import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Remediation Items ───────────────────────────────────────────────────────
export const remediationStatusEnum = pgEnum("remediation_status", [
  "open",
  "in_progress",
  "resolved",
]);
export const remediationPriorityEnum = pgEnum("remediation_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const remediationItemsTable = pgTable("remediation_items", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  questionId: integer("question_id"),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  owner: text("owner"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  priority: remediationPriorityEnum("priority").notNull().default("medium"),
  status: remediationStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertRemediationItemSchema = createInsertSchema(
  remediationItemsTable
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRemediationItem = z.infer<typeof insertRemediationItemSchema>;
export type RemediationItem = typeof remediationItemsTable.$inferSelect;

// ── Assessment Collaborators ────────────────────────────────────────────────
export const collaboratorRoleEnum = pgEnum("collaborator_role", [
  "viewer",
  "editor",
]);

export const assessmentCollaboratorsTable = pgTable("assessment_collaborators", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  ownerId: text("owner_id").notNull(),
  collaboratorEmail: text("collaborator_email").notNull(),
  role: collaboratorRoleEnum("role").notNull().default("viewer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAssessmentCollaboratorSchema = createInsertSchema(
  assessmentCollaboratorsTable
).omit({ id: true, createdAt: true });
export type InsertAssessmentCollaborator = z.infer<
  typeof insertAssessmentCollaboratorSchema
>;
export type AssessmentCollaborator =
  typeof assessmentCollaboratorsTable.$inferSelect;
