import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";
import { db, assessmentsTable, answersTable, sessionsTable } from "@workspace/db";
import type { AuthUser } from "@workspace/api-zod";
import app from "../app";
import { createSession } from "../lib/auth";

const stamp = Date.now();

function makeUser(suffix: string): AuthUser {
  return {
    id: `test-user-${suffix}-${stamp}`,
    email: `test-${suffix}-${stamp}@example.test`,
    firstName: "Test",
    lastName: suffix,
    profileImageUrl: null,
  };
}

const userA = makeUser("a");
const userB = makeUser("b");

let sidA = "";
let sidB = "";
const createdAssessmentIds: number[] = [];

beforeAll(async () => {
  sidA = await createSession({ user: userA, access_token: "test-token-a" });
  sidB = await createSession({ user: userB, access_token: "test-token-b" });
});

afterAll(async () => {
  if (createdAssessmentIds.length > 0) {
    await db
      .delete(answersTable)
      .where(inArray(answersTable.assessmentId, createdAssessmentIds));
    await db
      .delete(assessmentsTable)
      .where(inArray(assessmentsTable.id, createdAssessmentIds));
  }
  await db.delete(assessmentsTable).where(eq(assessmentsTable.userId, userA.id));
  await db.delete(assessmentsTable).where(eq(assessmentsTable.userId, userB.id));
  if (sidA) await db.delete(sessionsTable).where(eq(sessionsTable.sid, sidA));
  if (sidB) await db.delete(sessionsTable).where(eq(sessionsTable.sid, sidB));
});

const auth = (sid: string) => ({ Authorization: `Bearer ${sid}` });

describe("assessments authorization", () => {
  it("rejects unauthenticated access to the assessment list", async () => {
    const res = await request(app).get("/api/assessments");
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated access to history", async () => {
    const res = await request(app).get("/api/assessments/history");
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated access to a single assessment", async () => {
    const res = await request(app).get("/api/assessments/1");
    expect(res.status).toBe(401);
  });

  it("lets the owner create and read their own assessment", async () => {
    const create = await request(app)
      .post("/api/assessments")
      .set(auth(sidA))
      .send({ name: "IDOR Test", systemName: "System A" });
    expect([200, 201]).toContain(create.status);
    const id = create.body.id as number;
    expect(typeof id).toBe("number");
    createdAssessmentIds.push(id);

    const read = await request(app).get(`/api/assessments/${id}`).set(auth(sidA));
    expect(read.status).toBe(200);
    expect(read.body.id).toBe(id);
  });

  it("prevents a different user from reading another user's assessment (IDOR)", async () => {
    const id = createdAssessmentIds[0];
    const res = await request(app).get(`/api/assessments/${id}`).set(auth(sidB));
    expect(res.status).toBe(404);
  });

  it("prevents a different user from duplicating another user's assessment", async () => {
    const id = createdAssessmentIds[0];
    const res = await request(app)
      .post(`/api/assessments/${id}/duplicate`)
      .set(auth(sidB));
    expect(res.status).toBe(404);
  });

  it("prevents a different user from deleting another user's assessment", async () => {
    const id = createdAssessmentIds[0];
    const res = await request(app)
      .delete(`/api/assessments/${id}`)
      .set(auth(sidB));
    expect(res.status).toBe(404);

    // Owner can still read it — confirms it was not deleted.
    const read = await request(app).get(`/api/assessments/${id}`).set(auth(sidA));
    expect(read.status).toBe(200);
  });

  it("scopes history to the requesting user", async () => {
    const res = await request(app).get("/api/assessments/history").set(auth(sidA));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const systems = (res.body as Array<{ systemName: string }>).map((g) => g.systemName);
    expect(systems).toContain("System A");

    const resB = await request(app).get("/api/assessments/history").set(auth(sidB));
    expect(resB.status).toBe(200);
    const systemsB = (resB.body as Array<{ systemName: string }>).map((g) => g.systemName);
    expect(systemsB).not.toContain("System A");
  });
});
