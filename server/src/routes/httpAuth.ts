import type { Express, Request, Response } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import {
  signAccessToken,
  issueRefreshToken,
  revokeRefreshTokenByRaw,
  rotateRefreshToken,
  verifyPassword,
} from "../services/auth.js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  isProd,
} from "../lib/env.js";
import type { UserRole } from "@orthocare/shared";

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function defaultDashboardPath(role: UserRole): string {
  switch (role) {
    case "MSO_ADMIN":
      return "/admin/mso";
    case "CLINIC_ADMIN":
      return "/dashboard/clinic-admin";
    case "CLINIC_USER":
      return "/dashboard/clinic-user";
    case "CLINIC_DOCTOR":
      return "/dashboard/doctor";
    case "PATIENT":
      return "/portal";
    default:
      return "/";
  }
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const common = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...common,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...common,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
}

export function registerAuthHttpRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }
    const { email, password } = parsed.data;
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role as UserRole,
      clinicId: user.clinicId,
    });
    const refreshToken = await issueRefreshToken(user.id);
    setAuthCookies(res, accessToken, refreshToken);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        clinicId: user.clinicId,
      },
      redirectTo: defaultDashboardPath(user.role as UserRole),
    });
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    const rt = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (rt) {
      await revokeRefreshTokenByRaw(rt);
    }
    clearAuthCookies(res);
    return res.json({ ok: true });
  });

  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    const rt = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!rt) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "No refresh token" });
    }
    const rotated = await rotateRefreshToken(rt);
    if (!rotated) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Invalid session" });
    }
    setAuthCookies(res, rotated.accessToken, rotated.refreshToken);
    return res.json({ ok: true });
  });
}
