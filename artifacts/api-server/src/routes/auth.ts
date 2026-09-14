import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import {
  clearSession,
  createSession,
  deleteSession,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

const AUTH_USERNAME = process.env.AUTH_USERNAME ?? "admin";
const AUTH_PASSWORD = process.env.AUTH_PASSWORD ?? "admin";
const LOCAL_USER_ID = "local-admin";

async function ensureLocalUser() {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, LOCAL_USER_ID));

  if (existing) return existing;

  const [created] = await db
    .insert(usersTable)
    .values({
      id: LOCAL_USER_ID,
      email: `${AUTH_USERNAME}@localhost.local`,
      firstName: AUTH_USERNAME,
      lastName: null,
      profileImageUrl: null,
    })
    .onConflictDoNothing()
    .returning();

  return created;
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body ?? {};

  if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const user = await ensureLocalUser();
  if (!user) {
    res.status(500).json({ error: "Erro ao criar usuário" });
    return;
  }

  const sessionData: SessionData = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
  };

  const sid = await createSession(sessionData);

  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });

  res.json({ user: sessionData.user });
});

router.post("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

router.post("/mobile-auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) await deleteSession(sid);
  res.json({ success: true });
});

export default router;
