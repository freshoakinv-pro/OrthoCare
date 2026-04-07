import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
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
import { getRefreshTokenFromRequest } from "../middleware/context.js";

function setAuthCookies(
  res: import("express").Response,
  accessToken: string,
  refreshToken: string,
) {
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

function clearAuthCookies(res: import("express").Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
}

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    const u = ctx.user;
    return {
      userId: u.userId,
      role: u.role,
      clinicId: u.clinicId,
      email: u.email,
      fullName: u.fullName,
    };
  }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
      if (!user || !user.isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      const ok = await verifyPassword(input.password, user.passwordHash);
      if (!ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      const accessToken = signAccessToken({
        sub: user.id,
        role: user.role as import("@orthocare/shared").UserRole,
        clinicId: user.clinicId,
      });
      const refreshToken = await issueRefreshToken(user.id);
      setAuthCookies(ctx.res, accessToken, refreshToken);

      return {
        user: {
          userId: user.id,
          role: user.role,
          clinicId: user.clinicId,
          email: user.email,
          fullName: user.fullName,
        },
      };
    }),

  refresh: publicProcedure.mutation(async ({ ctx }) => {
    const rt = getRefreshTokenFromRequest(ctx.req);
    if (!rt) {
      clearAuthCookies(ctx.res);
      return { ok: false as const };
    }
    const rotated = await rotateRefreshToken(rt);
    if (!rotated) {
      clearAuthCookies(ctx.res);
      return { ok: false as const };
    }
    setAuthCookies(ctx.res, rotated.accessToken, rotated.refreshToken);
    return { ok: true as const };
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const rt = getRefreshTokenFromRequest(ctx.req);
    if (rt) {
      await revokeRefreshTokenByRaw(rt);
    }
    clearAuthCookies(ctx.res);
    return { ok: true as const };
  }),
});
