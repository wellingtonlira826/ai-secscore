import {
  pgTable,
  text,
  serial,
  integer,
  real,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Corporate AI maturity domains (34 domains grouped in pillars) ─────────────
export const corpDomainsTable = pgTable("corp_domains", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  pillar: text("pillar").notNull(),
  description: text("description").notNull(),
  weight: real("weight").notNull().default(1),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCorpDomainSchema = createInsertSchema(corpDomainsTable).omit({ id: true, createdAt: true });
export type InsertCorpDomain = z.infer<typeof insertCorpDomainSchema>;
export type CorpDomain = typeof corpDomainsTable.$inferSelect;

// ── Corporate questions ────────────────────────────────────────────────────────
export const corpAnswerTypeEnum = pgEnum("corp_answer_type", [
  "yes_no",
  "scale_1_5",
  "multiple_choice",
  "text",
  "percent",
]);

export const corpCriticalityEnum = pgEnum("corp_criticality", [
  "baixa",
  "media",
  "alta",
  "critica",
]);

export const corpQuestionsTable = pgTable("corp_questions", {
  id: serial("id").primaryKey(),
  domainId: integer("domain_id").notNull(),
  order: integer("order").notNull().default(0),
  text: text("text").notNull(),
  description: text("description").notNull(),
  objective: text("objective").notNull(),
  justification: text("justification").notNull(),
  marketReference: text("market_reference").notNull(),
  criticality: corpCriticalityEnum("criticality").notNull().default("media"),
  weight: integer("weight").notNull().default(3),
  answerType: corpAnswerTypeEnum("answer_type").notNull(),
  options: text("options").array(),
  required: boolean("required").notNull().default(false),
  eliminatory: boolean("eliminatory").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCorpQuestionSchema = createInsertSchema(corpQuestionsTable).omit({ id: true, createdAt: true });
export type InsertCorpQuestion = z.infer<typeof insertCorpQuestionSchema>;
export type CorpQuestion = typeof corpQuestionsTable.$inferSelect;

// ── Corporate answers ──────────────────────────────────────────────────────────
export const corpAnswersTable = pgTable("corp_answers", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  questionId: integer("question_id").notNull(),
  boolValue: boolean("bool_value"),
  scaleValue: integer("scale_value"),
  choiceValue: text("choice_value"),
  textValue: text("text_value"),
  percentValue: real("percent_value"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCorpAnswerSchema = createInsertSchema(corpAnswersTable).omit({ id: true, updatedAt: true });
export type InsertCorpAnswer = z.infer<typeof insertCorpAnswerSchema>;
export type CorpAnswer = typeof corpAnswersTable.$inferSelect;

// ── Benchmark reference data (curated market data, editable seed) ─────────────
export const corpBenchmarkProfilesTable = pgTable("corp_benchmark_profiles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull().default(0),
});

export const insertCorpBenchmarkProfileSchema = createInsertSchema(corpBenchmarkProfilesTable).omit({ id: true });
export type InsertCorpBenchmarkProfile = z.infer<typeof insertCorpBenchmarkProfileSchema>;
export type CorpBenchmarkProfile = typeof corpBenchmarkProfilesTable.$inferSelect;

export const corpBenchmarkScoresTable = pgTable("corp_benchmark_scores", {
  id: serial("id").primaryKey(),
  profileSlug: text("profile_slug").notNull(),
  domainSlug: text("domain_slug").notNull(),
  score: real("score").notNull(),
});

export const insertCorpBenchmarkScoreSchema = createInsertSchema(corpBenchmarkScoresTable).omit({ id: true });
export type InsertCorpBenchmarkScore = z.infer<typeof insertCorpBenchmarkScoreSchema>;
export type CorpBenchmarkScore = typeof corpBenchmarkScoresTable.$inferSelect;

// ── Maturity model (5 levels) reference data ──────────────────────────────────
export const maturityLevelsTable = pgTable("maturity_levels", {
  id: serial("id").primaryKey(),
  level: integer("level").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  characteristics: text("characteristics").array().notNull(),
});

export const insertMaturityLevelSchema = createInsertSchema(maturityLevelsTable).omit({ id: true });
export type InsertMaturityLevel = z.infer<typeof insertMaturityLevelSchema>;
export type MaturityLevel = typeof maturityLevelsTable.$inferSelect;
