import {
  pgTable,
  text,
  serial,
  integer,
  real,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Frameworks ─────────────────────────────────────────────────────────────────
export const frameworksTable = pgTable("frameworks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  defaultWeight: real("default_weight").notNull().default(1),
  category: text("category"),
  referenceUrl: text("reference_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFrameworkSchema = createInsertSchema(frameworksTable).omit({ id: true, createdAt: true });
export type InsertFramework = z.infer<typeof insertFrameworkSchema>;
export type Framework = typeof frameworksTable.$inferSelect;

// ── Questions ──────────────────────────────────────────────────────────────────
export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  frameworkId: integer("framework_id").notNull(),
  section: text("section").notNull(),
  text: text("text").notNull(),
  weight: integer("weight").notNull().default(2),
  order: integer("order").notNull().default(0),
  remediation: text("remediation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;

// ── User Framework Weights ─────────────────────────────────────────────────────
export const userFrameworkWeightsTable = pgTable("user_framework_weights", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  frameworkId: integer("framework_id").notNull(),
  weight: real("weight").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserFrameworkWeightSchema = createInsertSchema(userFrameworkWeightsTable).omit({ id: true });
export type InsertUserFrameworkWeight = z.infer<typeof insertUserFrameworkWeightSchema>;
export type UserFrameworkWeight = typeof userFrameworkWeightsTable.$inferSelect;

// ── Assessments ────────────────────────────────────────────────────────────────
export const assessmentStatusEnum = pgEnum("assessment_status", ["in_progress", "completed"]);
export const assessmentTypeEnum = pgEnum("assessment_type", ["security", "corporate"]);

export const assessmentsTable = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: assessmentTypeEnum("type").notNull().default("security"),
  name: text("name").notNull(),
  systemName: text("system_name").notNull(),
  description: text("description"),
  status: assessmentStatusEnum("status").notNull().default("in_progress"),
  reviewFrequencyDays: integer("review_frequency_days"),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAssessmentSchema = createInsertSchema(assessmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessmentsTable.$inferSelect;

// ── Answers ────────────────────────────────────────────────────────────────────
export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  questionId: integer("question_id").notNull(),
  maturityLevel: integer("maturity_level"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAnswerSchema = createInsertSchema(answersTable).omit({ id: true });
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answersTable.$inferSelect;
