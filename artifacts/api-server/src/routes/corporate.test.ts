import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  assessmentsTable,
  corpAnswersTable,
  corpQuestionsTable,
  sessionsTable,
} from "@workspace/db";
import type { AuthUser } from "@workspace/api-zod";
import app from "../app";
import { createSession } from "../lib/auth";

const stamp = Date.now();

function makeUser(suffix: string): AuthUser {
  return {
    id: `corp-test-${suffix}-${stamp}`,
    email: `corp-test-${suffix}-${stamp}@example.test`,
    firstName: "Corp",
    lastName: suffix,
    profileImageUrl: null,
  };
}

const userA = makeUser("a");
const userB = makeUser("b");

let sidA = "";
let sidB = "";
let assessmentId = 0;

const auth = (sid: string) => ({ Authorization: `Bearer ${sid}` });

beforeAll(async () => {
  sidA = await createSession({ user: userA, access_token: "corp-token-a" });
  sidB = await createSession({ user: userB, access_token: "corp-token-b" });

  const res = await request(app)
    .post("/api/assessments")
    .set(auth(sidA))
    .send({ type: "corporate", name: "Corp Test", systemName: "ACME" });
  expect(res.status).toBe(201);
  assessmentId = res.body.id;
});

afterAll(async () => {
  if (assessmentId) {
    await db.delete(corpAnswersTable).where(eq(corpAnswersTable.assessmentId, assessmentId));
  }
  await db
    .delete(assessmentsTable)
    .where(inArray(assessmentsTable.userId, [userA.id, userB.id]));
  if (sidA) await db.delete(sessionsTable).where(eq(sessionsTable.sid, sidA));
  if (sidB) await db.delete(sessionsTable).where(eq(sessionsTable.sid, sidB));
});

describe("corporate scoring routes", () => {
  it("rejects unauthenticated score requests", async () => {
    const res = await request(app).get(`/api/assessments/${assessmentId}/corporate-score`);
    expect(res.status).toBe(401);
  });

  it("hides the assessment from other users (404, not 403)", async () => {
    const res = await request(app)
      .get(`/api/assessments/${assessmentId}/corporate-score`)
      .set(auth(sidB));
    expect(res.status).toBe(404);
  });

  it("returns null scores for an unanswered assessment and blocks completion", async () => {
    const res = await request(app)
      .get(`/api/assessments/${assessmentId}/corporate-score`)
      .set(auth(sidA));
    expect(res.status).toBe(200);
    expect(res.body.overallScore).toBeNull();
    expect(res.body.maturityLevel).toBeNull();
    expect(res.body.canComplete).toBe(false);
    expect(res.body.missingRequired.length).toBeGreaterThan(0);
    expect(res.body.domains).toHaveLength(34);
    expect(res.body.pillars).toHaveLength(7);
    expect(res.body.indices.map((i: { key: string }) => i.key).sort()).toEqual([
      "agent_readiness",
      "genai_readiness",
      "maturity",
      "risk",
    ]);
  });

  it("rejects completing a corporate assessment with unanswered required questions", async () => {
    const res = await request(app)
      .patch(`/api/assessments/${assessmentId}`)
      .set(auth(sidA))
      .send({ status: "completed" });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("required_questions_missing");
    expect(res.body.missingRequired.length).toBeGreaterThan(0);
  });

  it("scores answers and flags failed eliminatory questions", async () => {
    const [eliminatory] = await db
      .select()
      .from(corpQuestionsTable)
      .where(eq(corpQuestionsTable.eliminatory, true))
      .limit(1);
    expect(eliminatory).toBeDefined();
    expect(eliminatory.answerType).toBe("yes_no");

    const put = await request(app)
      .put(`/api/assessments/${assessmentId}/corporate-answers/${eliminatory.id}`)
      .set(auth(sidA))
      .send({ boolValue: false });
    expect(put.status).toBe(200);

    const res = await request(app)
      .get(`/api/assessments/${assessmentId}/corporate-score`)
      .set(auth(sidA));
    expect(res.status).toBe(200);
    expect(res.body.answeredCount).toBe(1);
    expect(res.body.eliminatoryFailures.some((f: { questionId: number }) => f.questionId === eliminatory.id)).toBe(true);
    const domain = res.body.domains.find(
      (d: { domainId: number }) => d.domainId === eliminatory.domainId,
    );
    expect(domain.score).toBe(0);
    expect(domain.maturityLevel).toBe(1);
  });

  it("lists benchmark profiles publicly", async () => {
    const res = await request(app).get("/api/corporate/benchmark-profiles");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
    expect(res.body[0].slug).toBe("banco-digital");
  });

  it("compares against a benchmark profile", async () => {
    const res = await request(app)
      .get(`/api/assessments/${assessmentId}/corporate-benchmark?profile=banco-digital`)
      .set(auth(sidA));
    expect(res.status).toBe(200);
    expect(res.body.profileSlug).toBe("banco-digital");
    expect(res.body.domains).toHaveLength(34);
    expect(res.body.pillars).toHaveLength(7);
    expect(res.body.overallBenchmark).toBeGreaterThan(0);
    const answered = res.body.domains.find(
      (d: { clientScore: number | null }) => d.clientScore != null,
    );
    expect(answered).toBeDefined();
    expect(answered.delta).toBe(
      Math.round((answered.clientScore - answered.benchmarkScore) * 10) / 10,
    );
  });

  it("rejects unknown benchmark profiles", async () => {
    const res = await request(app)
      .get(`/api/assessments/${assessmentId}/corporate-benchmark?profile=nope`)
      .set(auth(sidA));
    expect(res.status).toBe(400);
  });
});
